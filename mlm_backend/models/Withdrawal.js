const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberId: { type: String, required: true },
    grossAmount: { type: Number, required: true },
    tdsAmount: { type: Number, required: true },
    adminChargeAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestDate: { type: Date, default: Date.now },
    processDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
