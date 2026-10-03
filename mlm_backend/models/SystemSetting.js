const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Royal Kuberaa' },
    tdsPercentage: { type: Number, default: 5 },
    adminChargePercentage: { type: Number, default: 5 },
    maintenanceMode: { type: Boolean, default: false },
    minimumWithdrawal: { type: Number, default: 200 },
    // Company Banking & UPI Details for Deposits
    companyBankName: { type: String, default: 'HDFC Bank' },
    companyAccountName: { type: String, default: 'Royal Kuberaa Solutions' },
    companyAccountNumber: { type: String, default: '50200012345678' },
    companyIfsc: { type: String, default: 'HDFC0001234' },
    companyUpiId: { type: String, default: 'royalkuberaa@hdfcbank' },
    companyQrUrl: { type: String, default: '' }
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
