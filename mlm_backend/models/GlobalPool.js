const mongoose = require('mongoose');

const GlobalPoolSchema = new mongoose.Schema({
    poolName: {
        type: String,
        required: true,
        enum: ['GOLD', 'PLATINUM', 'RUBY', 'DIAMOND', 'NON_WORKING']
    },
    totalFund: {
        type: Number,
        default: 0
    },
    // Array of memberIds who are in the active queue for this pool
    activeQueue: [{
        memberId: String,
        addedAt: Date
    }]
}, { timestamps: true });

module.exports = mongoose.model('GlobalPool', GlobalPoolSchema);
