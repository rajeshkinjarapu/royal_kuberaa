const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Royal Kuberaa' },
    tdsPercentage: { type: Number, default: 5 },
    adminChargePercentage: { type: Number, default: 5 },
    maintenanceMode: { type: Boolean, default: false },
    minimumWithdrawal: { type: Number, default: 200 }
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
