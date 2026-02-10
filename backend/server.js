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

// Load environment variables
dotenv.config();

// ─── MONGODB CONNECTION ──────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env file');
    process.exit(1);
}

if (!JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET not found in .env file');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    dbName: 'ambiora', // Explicitly set database name
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}`);
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('\n📋 Troubleshooting:');
        console.error('1. Check MongoDB Atlas Network Access (allow 0.0.0.0/0)');
        console.error('2. Verify database user credentials');
        console.error('3. Try local MongoDB: MONGODB_URI=mongodb://localhost:27017/ambiora');
        console.error('4. See MONGODB_TROUBLESHOOTING.md for detailed solutions\n');
        process.exit(1);
    });


const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────
app.use(cors());
app.use(express.json());

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

        // Create new user (password will be hashed by the model)
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.replace(/\s/g, ''),
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

// Get all registrations with user details
app.get('/api/admin/registrations', authenticateAdmin, async (req, res) => {
    try {
        const registrations = await EventRegistration.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            registrations
        });
    } catch (error) {
        console.error('❌ Admin registrations error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error fetching registration data'
        });
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
app.listen(PORT, () => {
    console.log(`\n🚀 Ambiora Payment Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${CASHFREE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
