import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    events: [{
        eventId: {
            type: String,
            required: true
        },
        eventName: {
            type: String,
            required: true
        },
        eventPrice: {
            type: Number,
            required: true
        },
        eventCategory: String,
        eventDate: String,
        eventDescription: String
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    paymentSessionId: String,
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
eventRegistrationSchema.index({ userId: 1, createdAt: -1 });
eventRegistrationSchema.index({ orderId: 1 });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

export default EventRegistration;
