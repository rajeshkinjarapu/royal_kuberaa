const mongoose = require('mongoose');

const MatrixNodeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    memberId: {
        type: String,
        required: true
    },
    poolLevel: {
        type: Number,
        required: true,
        default: 1 // 1 to 5
    },
    nodeIndex: {
        type: Number,
        required: true
        // Sequential index: 1, 2, 3, ... to find parent mathematically
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MatrixNode'
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MatrixNode'
    }],
    isRebirth: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index to quickly find the next empty node in a specific pool level
MatrixNodeSchema.index({ poolLevel: 1, nodeIndex: 1 }, { unique: true });

module.exports = mongoose.model('MatrixNode', MatrixNodeSchema);
