const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    bv: { type: Number, default: 100 }, // Business Volume
    image: { type: String, default: '📦' }, // Can be an emoji or an image URL
    badge: { type: String, default: '' }, // e.g., 'BEST SELLER'
    deliveryInfo: { type: String, default: 'Doorstep Courier Delivery' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
