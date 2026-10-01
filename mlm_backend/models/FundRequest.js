const mongoose = require('mongoose');

const FundRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberId: { type: String, required: true },
    amount: { type: Number, required: true },
    utrNumber: { type: String, required: true },
    receiptUrl: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestDate: { type: Date, default: Date.now },
    processDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('FundRequest', FundRequestSchema);
