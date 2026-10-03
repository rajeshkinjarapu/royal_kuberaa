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
    tpin: {
        type: String,
        default: '' // Default empty means user has to set it first
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

    // Binary Tree System
    placement: { type: String, enum: ['Left', 'Right'] }, // The leg they were placed on
    uplineId: { type: String }, // The immediate node above them in the binary tree
    leftUpline: { type: String }, // Who is on their left
    rightUpline: { type: String }, // Who is on their right
    
    // Pair Matching Trackers
    leftTeamCount: { type: Number, default: 0 },
    rightTeamCount: { type: Number, default: 0 },
    leftCarryForward: { type: Number, default: 0 },
    rightCarryForward: { type: Number, default: 0 },
    totalPairsMatched: { type: Number, default: 0 },
    todayPairsCount: { type: Number, default: 0 },
    todayPairsFlushedCount: { type: Number, default: 0 }, // Tracks flushed out pairs per day
    hasCompletedFirstPair: { type: Boolean, default: false },

    // Ranks Eligibility
    isGold: { type: Boolean, default: false },
    isPlatinum: { type: Boolean, default: false },
    isRuby: { type: Boolean, default: false },
    isDiamond: { type: Boolean, default: false },

    // Royalty Capping Trackers
    goldEarnings: { type: Number, default: 0 },
    platinumEarnings: { type: Number, default: 0 },
    rubyEarnings: { type: Number, default: 0 },
    diamondEarnings: { type: Number, default: 0 },

    // Autopool & Cashback Status
    autopoolLevel: { type: Number, default: 1 }, // 1 to 5
    autopoolBalance: { type: Number, default: 0 },
    cashbackEarnings: { type: Number, default: 0 }, // Tracks non-working cashback received towards ₹1000 recovery

    isActive: {
        type: Boolean,
        default: true
    },

    // KYC & Bank Details
    panNumber: { type: String, default: '' },
    aadharNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    kycStatus: { type: String, enum: ['Pending', 'Submitted', 'Approved', 'Rejected'], default: 'Pending' },
    
    // Awards & Rewards Tracking
    claimedRewards: [{
        pairs: Number,
        rewardName: String,
        amount: Number,
        claimedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
