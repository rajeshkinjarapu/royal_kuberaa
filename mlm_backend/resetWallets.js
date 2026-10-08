const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const GlobalPool = require('./models/GlobalPool');
const MatrixNode = require('./models/MatrixNode');
const Withdrawal = require('./models/Withdrawal');

mongoose.connect('mongodb://127.0.0.1:27017/royalkuberaa')
    .then(async () => {
        console.log("Connected to MongoDB.");

        // Reset all user wallets to 0
        const result = await User.updateMany({}, {
            $set: {
                mainWallet: 0,
                rebirthWallet: 0,
                totalEarnings: 0
            }
        });
        console.log(`Reset wallets for ${result.modifiedCount} users to 0.`);

        // Delete all transactions so history is completely wiped
        await Transaction.deleteMany({});
        console.log("Deleted all transactions.");

        // Reset pools and tree as well for a completely fresh start
        await GlobalPool.deleteMany({});
        await MatrixNode.deleteMany({});
        await Withdrawal.deleteMany({});
        
        console.log("System amounts cleared successfully!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
