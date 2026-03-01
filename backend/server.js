/* ============================================
   AMBIORA - BACKEND SERVER
   Express.js server for Cashfree payment integration
   
   Run: npm run server
   ============================================ */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import EventRegistration from './models/EventRegistration.js';
import Newsletter from './models/Newsletter.js';
import Team from './models/Team.js';

// Load environment variables
dotenv.config();

// ─── MONGODB CONNECTION ──────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env file');
    // process.exit(1); // Don't crash serverless function immediately
}

if (!JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET not found in .env file');
    // process.exit(1);
}

// Connect to MongoDB with caching for serverless
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: 'ambiora',
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// Connect immediately if not serverless (optional, but good for local)
// connectDB();



const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────
app.use(cors());
app.use(express.json());

// Ensure DB connection for every request (Serverless pattern)
app.use(async (req, res, next) => {
    if (!isConnected) {
        await connectDB();
    }
    next();
});

// ─── AUTHENTICATION MIDDLEWARE ───────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};


// ─── AUTHENTICATION ENDPOINTS ────────────────────────

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if SAP ID is provided and unique (if not empty)
        let sapIdData = {};
        if (req.body.sapId && req.body.sapId.trim()) {
            const sapId = req.body.sapId.trim();
            const existingSap = await User.findOne({ sapId });
            if (existingSap) {
                return res.status(400).json({
                    success: false,
                    message: 'SAP ID already registered'
                });
            }
            sapIdData.sapId = sapId;
        }

        // Create new user (password will be hashed by the model)
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.replace(/\s/g, ''),
            ...sapIdData,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ New user registered: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('❌ Signup error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during signup',
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ User logged in: ${user.email}`);

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

// Get current user endpoint (protected)
app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('❌ Get user error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update user profile (protected)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { sapId, phone, name } = req.body;
        const updates = {};

        if (name) updates.name = name.trim();
        if (phone) updates.phone = phone.replace(/\s/g, '');

        if (sapId) {
            const sid = sapId.trim();
            // Check uniqueness if changing
            const existing = await User.findOne({ sapId: sid });
            if (existing && existing._id.toString() !== req.user.id) {
                return res.status(400).json({ success: false, message: 'SAP ID already taken' });
            }
            updates.sapId = sid;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ success: true, user });

    } catch (error) {
        console.error('❌ Update profile error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── TEAM MANAGEMENT ENDPOINTS ───────────────────────

import { eventsData } from '../src/data/eventsData.js';

// Create Team (Leader only)
app.post('/api/teams', authenticateToken, async (req, res) => {
    try {
        const { name, eventId } = req.body;

        if (!name || !eventId) {
            return res.status(400).json({ success: false, message: 'Team name and Event ID required' });
        }

        const user = await User.findById(req.user.id);

        // Enforce SAP ID for Leader
        if (!user.sapId) {
            return res.status(400).json({
                success: false,
                message: 'Leader must have an SAP ID to create a team. Please update your profile.'
            });
        }

        // Generate unique 6-char invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const team = new Team({
            name: name.trim(),
            eventId,
            leaderId: req.user.id,
            inviteCode,
            members: [{
                userId: req.user.id,
                name: user.name,
                email: user.email,
                sapId: user.sapId,
                status: 'accepted' // Leader is always accepted
            }]
        });

        await team.save();

        res.status(201).json({ success: true, team });

    } catch (error) {
        console.error('❌ Create team error:', error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Team name or Invite code collision. Try again.' });
        }
        res.status(500).json({ success: false, message: 'Server error creating team' });
    }
});

// DEBUG ENDPOINT
app.get('/api/debug-registrations', async (req, res) => {
    try {
        const regs = await EventRegistration.find().sort({ createdAt: -1 });
        res.json({ count: regs.length, example: regs[0] || 'No data', all: regs });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get User's Teams
app.get('/api/teams', authenticateToken, async (req, res) => {
    try {
        // Find teams where user is leader OR a member
        const teams = await Team.find({
            $or: [
                { leaderId: req.user.id },
                { 'members.userId': req.user.id }
            ]
        }).sort({ createdAt: -1 });

        res.json({ success: true, teams });
    } catch (error) {
        console.error('❌ Get teams error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching teams' });
    }
});

// Get Team Info by Invite Code (Public for join page)
app.get('/api/teams/:inviteCode', async (req, res) => {
    try {
        const team = await Team.findOne({ inviteCode: req.params.inviteCode })
            .select('name eventId members.length leaderId'); // Don't expose member details publicy yet

        if (!team) return res.status(404).json({ success: false, message: 'Invalid invite code' });

        // Fetch leader name
        const leader = await User.findById(team.leaderId).select('name');

        res.json({
            success: true,
            team: {
                id: team._id,
                name: team.name,
                eventId: team.eventId,
                leaderName: leader ? leader.name : 'Unknown',
                memberCount: team.members.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Join Team
app.post('/api/teams/join', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        const team = await Team.findOne({ inviteCode });
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

        // Check if already member
        const isMember = team.members.some(m => m.userId.toString() === req.user.id);
        if (isMember) return res.status(400).json({ success: false, message: 'You are already in this team' });

        const user = await User.findById(req.user.id);

        if (!user.sapId) {
            return res.status(400).json({
                success: false,
                message: 'SAP ID required to join team. Please update your profile.'
            });
        }

        // PAYMENT VERIFICATION FOR PER-PARTICIPANT EVENTS
        const event = eventsData.find(e => e.id === team.eventId);

        if (event) {
            // Determine if event is "Per Participant"
            // If priceNote is 'Per Team', only leader pays.
            // If priceNote is NOT 'Per Team' (e.g. 'Per Person' or empty/undefined default), THEN every member must pay.
            const isPerTeam = event.priceNote && event.priceNote.toLowerCase().includes('per team');

            if (!isPerTeam) {
                // Member must have paid registration
                const registration = await EventRegistration.findOne({
                    userId: req.user.id,
                    'events.eventId': team.eventId,
                    // Check for success (case insensitive if needed, but usually standardized)
                    paymentStatus: { $regex: new RegExp('^success$', 'i') }
                });

                if (!registration) {
                    return res.status(400).json({
                        success: false,
                        message: `To join this team, you must first register and pay for "${event.name}".`
                    });
                }
            }
        }

        team.members.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            sapId: user.sapId,
            status: 'accepted'
        });

        await team.save();

        res.json({ success: true, message: 'Joined team successfully', team });

    } catch (error) {
        console.error('❌ Join team error:', error.message);
        res.status(500).json({ success: false, message: 'Server error joining team' });
    }
});

// Remove Team Member (Leader only)
app.delete('/api/teams/:teamId/members/:userId', authenticateToken, async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

        // Check if requester is leader
        if (team.leaderId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the team leader can remove members' });
        }

        // Prevent removing self (leader)
        if (userId === team.leaderId.toString()) {
            return res.status(400).json({ success: false, message: 'Leader cannot be removed. disband team instead.' });
        }

        // Remove member
        const initialLength = team.members.length;
        team.members = team.members.filter(m => m.userId.toString() !== userId);

        if (team.members.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Member not found in team' });
        }

        await team.save();

        res.json({ success: true, message: 'Member removed successfully', team });

    } catch (error) {
        console.error('❌ Remove member error:', error.message);
        res.status(500).json({ success: false, message: 'Server error removing member' });
    }
});

// ─── EVENT REGISTRATION ENDPOINTS ────────────────────

// Save event registration (protected)
app.post('/api/registrations', authenticateToken, async (req, res) => {
    try {
        const { events, totalAmount, orderId, paymentSessionId, paymentStatus } = req.body;

        // Validate required fields
        if (!events || !totalAmount || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get user details
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create registration
        const registration = new EventRegistration({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            userSapId: user.sapId || '',
            events,
            totalAmount,
            orderId,
            paymentSessionId,
            paymentStatus: paymentStatus || 'pending'
        });

        await registration.save();

        console.log(`✅ Event registration saved: ${orderId} for ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Registration saved successfully',
            registration
        });

    } catch (error) {
        console.error('❌ Registration save error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error saving registration',
            error: error.message
        });
    }
});

// Get user's registrations (protected)
app.get('/api/registrations', authenticateToken, async (req, res) => {
    try {
        const registrations = await EventRegistration.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            registrations
        });

    } catch (error) {
        console.error('❌ Get registrations error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching registrations',
            error: error.message
        });
    }
});

// Update registration payment status (protected)
app.patch('/api/registrations/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus, paymentDetails } = req.body;

        const registration = await EventRegistration.findOne({
            orderId,
            userId: req.user.id
        });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        if (paymentStatus) {
            registration.paymentStatus = paymentStatus;
        }

        if (paymentDetails) {
            registration.paymentDetails = paymentDetails;
        }

        await registration.save();

        console.log(`✅ Registration updated: ${orderId} - Status: ${paymentStatus}`);

        res.json({
            success: true,
            message: 'Registration updated successfully',
            registration
        });

    } catch (error) {
        console.error('❌ Update registration error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error updating registration',
            error: error.message
        });
    }
});

// ─── CASHFREE CONFIG ─────────────────────────────────
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';

const CASHFREE_API_URL = CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const API_VERSION = '2023-08-01';

// Validate credentials on startup
if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY || CASHFREE_SECRET_KEY === 'YOUR_SECRET_KEY_HERE') {
    console.warn('\n⚠️  WARNING: Cashfree credentials not configured!');
    console.warn('   Edit .env file and set CASHFREE_APP_ID and CASHFREE_SECRET_KEY\n');
}

// ─── CREATE ORDER ENDPOINT ───────────────────────────
app.post('/api/cashfree/create-order', async (req, res) => {
    try {
        // Validate credentials
        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY || CASHFREE_SECRET_KEY === 'YOUR_SECRET_KEY_HERE') {
            return res.status(500).json({
                success: false,
                error: 'Cashfree credentials not configured. Edit .env file.'
            });
        }

        const orderData = req.body;

        // Validate required fields
        if (!orderData.order_id || !orderData.order_amount || !orderData.customer_details) {
            return res.status(400).json({
                success: false,
                error: 'Missing required order fields'
            });
        }

        console.log(`📦 Creating order: ${orderData.order_id} | ₹${orderData.order_amount}`);

        // Call Cashfree API to create order
        const response = await fetch(`${CASHFREE_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION
            },
            body: JSON.stringify({
                order_id: orderData.order_id,
                order_amount: orderData.order_amount,
                order_currency: orderData.order_currency || 'INR',
                customer_details: {
                    customer_id: orderData.customer_details.customer_id,
                    customer_name: orderData.customer_details.customer_name,
                    customer_email: orderData.customer_details.customer_email,
                    customer_phone: orderData.customer_details.customer_phone
                },
                order_meta: orderData.order_meta || {},
                order_note: orderData.order_note || ''
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Cashfree API error:', result);
            return res.status(response.status).json({
                success: false,
                error: result.message || 'Failed to create order with Cashfree',
                details: result
            });
        }

        console.log(`✅ Order created: ${result.order_id} | Session: ${result.payment_session_id?.substring(0, 20)}...`);

        // Return payment session ID to frontend
        res.json({
            success: true,
            order_id: result.order_id,
            payment_session_id: result.payment_session_id,
            order_status: result.order_status
        });

    } catch (error) {
        console.error('❌ Server error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// ─── VERIFY PAYMENT ENDPOINT ─────────────────────────
app.get('/api/cashfree/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const response = await fetch(`${CASHFREE_API_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': API_VERSION
            }
        });

        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: result.message || 'Failed to fetch order'
            });
        }

        res.json({
            success: true,
            order_id: result.order_id,
            order_status: result.order_status,
            order_amount: result.order_amount
        });

    } catch (error) {
        console.error('❌ Verification error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ─── ADMIN ENDPOINTS ────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        const token = jwt.sign(
            { role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            success: true,
            token
        });
    }

    res.status(401).json({
        success: false,
        message: 'Invalid admin password'
    });
});

// Admin Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Admin token required' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        next();
    });
};

// Get all registrations with user details (including SAP ID from User collection)
app.get('/api/admin/registrations', authenticateAdmin, async (req, res) => {
    try {
        const registrations = await EventRegistration.find()
            .sort({ createdAt: -1 });

        // Collect all unique userIds from registrations
        const userIds = [...new Set(registrations.map(r => r.userId.toString()))];

        // Fetch all matching users and build a sapId lookup map
        const users = await User.find({ _id: { $in: userIds } }).select('_id sapId');
        const sapIdMap = {};
        users.forEach(u => {
            sapIdMap[u._id.toString()] = u.sapId || '';
        });

        // Merge sapId into each registration object
        const enrichedRegistrations = registrations.map(reg => {
            const obj = reg.toObject();
            // Prefer live sapId from User document; fall back to stored userSapId
            obj.userSapId = sapIdMap[reg.userId.toString()] || obj.userSapId || '';
            return obj;
        });

        res.json({
            success: true,
            registrations: enrichedRegistrations
        });
    } catch (error) {
        console.error('❌ Admin registrations error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching registration data'
        });
    }
});

// Get all teams with member details
app.get('/api/admin/teams', authenticateAdmin, async (req, res) => {
    try {
        const teams = await Team.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        console.error('❌ Admin teams error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching teams data'
        });
    }
});

// ─── NEWSLETTER ENDPOINTS ────────────────────────────
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if already subscribed
        const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existingSubscriber) {
            return res.status(200).json({ success: true, message: 'You are already subscribed!' });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();

        console.log(`✅ New newsletter subscriber: ${email}`);

        res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });

    } catch (error) {
        console.error('❌ Newsletter subscription error:', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─── HEALTH CHECK ────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        cashfree_configured: !!(CASHFREE_APP_ID && CASHFREE_SECRET_KEY && CASHFREE_SECRET_KEY !== 'YOUR_SECRET_KEY_HERE'),
        environment: CASHFREE_ENV
    });
});

// ─── START SERVER ────────────────────────────────────
// Only start server if running directly (not imported as module)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🚀 Ambiora Payment Server running on http://localhost:${PORT}`);
        console.log(`   Environment: ${CASHFREE_ENV}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
        connectDB(); // Connect immediately for local dev
    });
}

// Export for Vercel
export default app;
