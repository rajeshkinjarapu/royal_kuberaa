const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const GlobalPool = require('./models/GlobalPool');
const MatrixNode = require('./models/MatrixNode');
const Withdrawal = require('./models/Withdrawal');
const FundRequest = require('./models/FundRequest');

mongoose.connect('mongodb://127.0.0.1:27017/royal_kuberaa')
    .then(async () => {
        console.log("Connected to MongoDB for Clean Wipe.");

        // 1. Delete everyone EXCEPT Admin and RK0305
        const deleteResult = await User.deleteMany({
            role: { $ne: 'admin' },
            memberId: { $ne: 'RK0305' }
        });
        console.log(`Deleted ${deleteResult.deletedCount} old testing users.`);

        // 2. Reset RK0305 back to absolute Zero
        const resetResult = await User.updateOne(
            { memberId: 'RK0305' },
            {
                $set: {
                    mainWallet: 0,
                    rebirthWallet: 0,
                    totalEarnings: 0,
                    directReferralsCount: 0,
                    totalTeamCount: 0,
                    isGold: false,
                    isPlatinum: false,
                    isRuby: false,
                    isDiamond: false,
                    goldEarnings: 0,
                    platinumEarnings: 0,
                    rubyEarnings: 0,
                    diamondEarnings: 0,
                    cashbackEarnings: 0,
                    autopoolBalance: 0,
                    autopoolLevel: 1,
                    rank: 'STARTER',
                    directs: [] // Clear array of directs
                }
            }
        );
        console.log("RK0305 counters and wallet reset to absolute zero.");

        // 3. Delete all related records
        await Transaction.deleteMany({});
        await MatrixNode.deleteMany({});
        await FundRequest.deleteMany({});
        await Withdrawal.deleteMany({});
        await GlobalPool.deleteMany({});
        console.log("All transactions, pools, nodes, requests, and withdrawals cleared.");

        console.log("System is now completely clean and ready for fresh launch!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
