import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        minlength: [3, 'Team name must be at least 3 characters']
    },
    eventId: {
        type: String,
        required: [true, 'Event ID is required']
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviteCode: {
        type: String,
        unique: true,
        required: true
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        email: String,
        sapId: String,
        joinedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'accepted'],
            default: 'accepted' // Direct join via link is auto-accepted
        }
    }]
}, {
    timestamps: true
});

// Ensure invite code is unique
teamSchema.index({ inviteCode: 1 }, { unique: true });

// Prevent multiple teams for same event by same leader (optional, but good practice)
teamSchema.index({ leaderId: 1, eventId: 1 }, { unique: true });

const Team = mongoose.model('Team', teamSchema);

export default Team;
