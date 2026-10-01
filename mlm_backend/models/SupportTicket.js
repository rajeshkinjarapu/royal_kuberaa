const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberId: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Resolved', 'Closed'], default: 'Open' },
    reply: { type: String, default: '' },
    replyDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
