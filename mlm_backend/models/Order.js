const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    memberId: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true
    },
    memberName: {
        type: String,
        default: ''
    },
    memberMobile: {
        type: String,
        default: ''
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        default: ''
    },
    productPrice: {
        type: Number,
        required: true,
        default: 1500
    },
    deliveryCharge: {
        type: Number,
        required: true,
        default: 50
    },
    distanceKm: {
        type: Number,
        default: 250
    },
    deliveryZone: {
        type: String,
        default: 'Standard Delivery'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        pincode: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        addressLine: { type: String, required: true },
        landmark: { type: String, default: '' }
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending', 'Failed'],
        default: 'Paid'
    },
    paymentMethod: {
        type: String,
        default: 'MAIN_WALLET'
    },
    courierPartner: {
        type: String,
        default: ''
    },
    trackingNumber: {
        type: String,
        default: ''
    },
    dispatchDate: {
        type: Date
    },
    deliveryDate: {
        type: Date
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
