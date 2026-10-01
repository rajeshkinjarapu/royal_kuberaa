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
        required: false, // Not required for rebirth IDs
        trim: true
    },
    password: {
        type: String,
        required: false // Not required for rebirth IDs
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
    
    // Wallet System
    mainWallet: { type: Number, default: 0 },
    rebirthWallet: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // Rebirth ID Logic
    isRebirth: { type: Boolean, default: false },
    mainUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rebirthCount: { type: Number, default: 0 }, // Tracks how many rebirth IDs this main user generated

    // Directs & Network
    directReferralsCount: { type: Number, default: 0 },
    directs: [{ type: String }], // Array of memberIds sponsored directly

    // Ranks Eligibility
    isGold: { type: Boolean, default: false },
    isPlatinum: { type: Boolean, default: false },
    isRuby: { type: Boolean, default: false },
    isCrownDiamond: { type: Boolean, default: false },

    // Royalty Capping Trackers
    goldEarnings: { type: Number, default: 0 },
    platinumEarnings: { type: Number, default: 0 },
    rubyEarnings: { type: Number, default: 0 },
    crownDiamondEarnings: { type: Number, default: 0 },

    // Autopool Status
    autopoolLevel: { type: Number, default: 1 }, // 1 to 5
    autopoolBalance: { type: Number, default: 0 },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
