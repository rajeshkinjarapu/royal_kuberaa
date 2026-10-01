const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    sponsorId: {
        type: String,
        uppercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    rank: {
        type: String,
        default: 'STARTER'
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
