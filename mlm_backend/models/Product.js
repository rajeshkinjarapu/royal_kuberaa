const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    bv: { type: Number, required: true }, // Business Volume
    image: { type: String, default: '📦' }, // Can be an emoji or an image URL
    badge: { type: String, default: '' }, // e.g., 'BEST SELLER'
    deliveryInfo: { type: String, default: 'Free All-India Home Delivery' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
