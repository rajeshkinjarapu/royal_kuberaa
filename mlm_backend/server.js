require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const mlmLogic = require('./mlmLogic');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/royalkuberaa';
const JWT_SECRET = process.env.JWT_SECRET || 'royal_kuberaa_super_secret_key';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Database');
        
        // Initialize Default Admin if not exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const hashedAdminPassword = await bcrypt.hash('kallu0305', 10);
            await User.create({
                memberId: 'RK0305',
                password: hashedAdminPassword,
                name: 'Rajesh Kinjarapu',
                mobile: '9999999999',
                role: 'admin',
                rank: 'OWNER'
            });
            console.log('✅ Default Admin User Created (RK0305)');
        }
    })
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Cron Job - Runs everyday at 12:01 AM
cron.schedule('1 0 * * *', async () => {
    console.log('⏰ Running Daily Royalty Pool Distribution Cron Job...');
    try {
        await mlmLogic.processDailyPools();
        console.log('✅ Daily Pool Distribution Completed.');
    } catch (error) {
        console.error('❌ Cron Job Error:', error);
    }
});

// Manual Cron Trigger for Testing
app.post('/api/admin/trigger-cron', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        await mlmLogic.processDailyPools();
        res.json({ success: true, message: 'Daily Pool Distribution Triggered Successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error triggering cron" });
    }
});

// Basic Route
app.get('/', (req, res) => res.json({ message: "Royal Kuberaa Secure API Running on MongoDB" }));

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
    try {
        const { memberId, password } = req.body;
        
        // Find user by memberId or mobile
        const user = await User.findOne({ 
            $or: [{ memberId: memberId.toUpperCase() }, { mobile: memberId }] 
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid Login ID! Account does not exist.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked by Admin.' });
        }

        // Verify Password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect Password!' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, memberId: user.memberId, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        let calculatedRank = 'STARTER';
        if (user.isDiamond) calculatedRank = 'DIAMOND';
        else if (user.isRuby) calculatedRank = 'RUBY';
        else if (user.isPlatinum) calculatedRank = 'PLATINUM';
        else if (user.isGold) calculatedRank = 'GOLD';

        res.json({
            success: true,
            token,
            user: { 
                name: user.name, 
                memberId: user.memberId, 
                role: user.role, 
                rank: calculatedRank, 
                mainWallet: user.mainWallet, 
                sponsorId: user.sponsorId 
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
});

// --- Register / Activate Route ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, mobile, password, sponsorId, placement } = req.body;
        
        // Validation
        if (!name || !mobile || !password || !placement) {
            return res.status(400).json({ success: false, message: 'All fields including Position are required.' });
        }

        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Mobile number is already registered.' });
        }

        let sponsor = null;
        if (sponsorId) {
            sponsor = await User.findOne({ memberId: sponsorId.toUpperCase() });
            if (!sponsor) {
                return res.status(400).json({ success: false, message: 'Invalid Sponsor ID.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate Unique Member ID
        const generateId = () => 'RK' + Math.floor(10000 + Math.random() * 90000);
        let newMemberId = generateId();
        while (await User.findOne({ memberId: newMemberId })) {
            newMemberId = generateId();
        }
        
        const newUser = new User({
            memberId: newMemberId,
            name,
            mobile,
            password: hashedPassword,
            sponsorId: sponsor ? sponsor.memberId : null,
            placement: placement, // 'Left' or 'Right'
            role: 'member'
        });

        await newUser.save();

        // Trigger the MLM core logic for 1000 Rs distribution
        await mlmLogic.activateUser(newUser, sponsor, placement);

        res.status(201).json({ success: true, message: 'Registration successful! Rs 1000 distributed correctly.', user: newUser });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
});

// --- Fetch Sponsor Name ---
app.get('/api/sponsor/:id', async (req, res) => {
    try {
        const sponsor = await User.findOne({ memberId: req.params.id.toUpperCase() });
        if (sponsor) {
            res.json({ success: true, name: sponsor.name });
        } else {
            res.status(404).json({ success: false, message: 'Sponsor not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

// Dashboard Data Route (Protected & Real Data)
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const totalTeamSize = await User.countDocuments({ sponsorId: user.memberId });
        
        // Fetch Income breakdown from Transactions
        const Transaction = require('./models/Transaction');
        
        // Note: Our transactions type was set to 'CREDIT' in mlmLogic, and 'category' field is not there.
        // Wait, in mlmLogic.js we did not save 'category', we saved `type` as 'DIRECT', 'LEVEL' etc?
        // Ah, mlmLogic.js: addIncome doesn't save to Transaction properly. Wait, I should just fix the response using the User model fields for now or fetch by remark.
        // Let's rely on User model fields and a quick aggregation where possible.
        // Actually, we can just look up all transactions for the member.
        const txs = await Transaction.find({ memberId: user.memberId });
        let direct = 0, team = 0, autopool = 0, withdraw = 0;
        
        txs.forEach(tx => {
            if (tx.category === 'DIRECT') direct += tx.amount;
            if (tx.category === 'LEVEL') team += tx.amount;
            if (tx.category === 'AUTOPOOL') autopool += tx.amount;
            if (tx.category === 'Withdrawal') withdraw += tx.amount;
        });

        res.json({
            success: true,
            data: {
                totalEarnings: user.totalEarnings,
                mainWallet: user.mainWallet,
                rebirthWallet: user.rebirthWallet,
                directReferral: direct,
                teamIncome: team, 
                withdrawFund: withdraw, 
                autopoolFund: autopool, 
                allRanks: user.goldEarnings + user.platinumEarnings + user.rubyEarnings + user.crownDiamondEarnings,
                networkStats: { 
                    directReferrals: user.directReferralsCount, 
                    totalTeamSize: totalTeamSize,
                    leftTeamCount: user.leftTeamCount,
                    rightTeamCount: user.rightTeamCount,
                    leftCarryForward: user.leftCarryForward,
                    rightCarryForward: user.rightCarryForward,
                    todayPairsCount: user.todayPairsCount,
                    todayPairsFlushedCount: user.todayPairsFlushedCount,
                    totalPairsMatched: user.totalPairsMatched
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching dashboard" });
    }
});

// Admin Users List Route
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({ 
            success: true, 
            data: users.map(u => ({ id: u.memberId, name: u.name, wallet: u.mainWallet, status: u.isActive ? "Active" : "Blocked" })) 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// P2P Transfer Route (Protected)
app.post('/api/p2p-transfer', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { receiverId, amount } = req.body;
        const transferAmount = Number(amount);
        const Transaction = require('./models/Transaction');

        if (!receiverId || !transferAmount || transferAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount or receiver ID.' });
        }

        const sender = await User.findById(req.user.id).session(session);
        if (!sender) throw new Error('Sender not found');
        
        if (sender.memberId === receiverId.toUpperCase()) {
            return res.status(400).json({ success: false, message: 'You cannot transfer funds to yourself.' });
        }

        if (sender.mainWallet < transferAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        const receiver = await User.findOne({ memberId: receiverId.toUpperCase() }).session(session);
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'Receiver ID not found.' });
        }

        // Deduct from Sender
        sender.mainWallet -= transferAmount;
        await sender.save({ session });

        // Apply 5% charge for P2P transfer
        const transferCharge = transferAmount * 0.05;
        const netAmount = transferAmount - transferCharge;

        // Add to Receiver
        receiver.mainWallet += netAmount;
        await receiver.save({ session });

        // Record Transactions
        await Transaction.create([{
            userId: sender._id,
            memberId: sender.memberId,
            amount: transferAmount,
            type: 'Debit',
            category: 'P2P Transfer',
            remark: `Transferred to ${receiver.memberId}`
        }], { session });

        await Transaction.create([{
            userId: receiver._id,
            memberId: receiver.memberId,
            amount: transferAmount,
            type: 'Credit',
            category: 'P2P Transfer',
            remark: `Received from ${sender.memberId}`
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, message: 'P2P Transfer Successful!', newBalance: sender.mainWallet });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("P2P Transfer Error:", error);
        res.status(500).json({ success: false, message: "Server error during P2P transfer" });
    }
});

// Withdrawal Request Route
app.post('/api/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const withdrawAmount = Number(amount);
        const Withdrawal = require('./models/Withdrawal');

        if (!withdrawAmount || withdrawAmount < 200) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹200.' });
        }

        const user = await User.findById(req.user.id);
        if (user.mainWallet < withdrawAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient main wallet balance.' });
        }

        // Calculate Deductions (10% total charges)
        const tdsAmount = withdrawAmount * 0.05;
        const adminChargeAmount = withdrawAmount * 0.05;
        const netAmount = withdrawAmount - tdsAmount - adminChargeAmount;

        // Deduct from User Wallet
        user.mainWallet -= withdrawAmount;
        await user.save();

        // Record Withdrawal Request (Automatic Approval)
        await Withdrawal.create({
            userId: user._id,
            memberId: user.memberId,
            grossAmount: withdrawAmount,
            tdsAmount,
            adminChargeAmount,
            netAmount,
            status: 'Approved'
        });

        // Also record a transaction debit for withdrawal request
        const Transaction = require('./models/Transaction');
        await Transaction.create({
            userId: user._id,
            memberId: user.memberId,
            amount: withdrawAmount,
            type: 'Debit',
            category: 'Withdrawal',
            remark: `Withdrawal request initiated (Net: ₹${netAmount})`
        });

        res.json({ success: true, message: 'Withdrawal Request Submitted Successfully!', newBalance: user.mainWallet });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during withdrawal" });
    }
});

// Admin: Fetch all withdrawals
app.get('/api/admin/withdrawals', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const Withdrawal = require('./models/Withdrawal');
        const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
        res.json({ success: true, data: withdrawals });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Admin Users List Route
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            data: users.map(u => ({ id: u.memberId, name: u.name, wallet: u.mainWallet, status: u.isActive ? "Active" : "Blocked" })) 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Admin: Toggle User Block/Unblock
app.post('/api/admin/users/:id/toggle-block', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const userToUpdate = await User.findOne({ memberId: req.params.id });
        if (!userToUpdate) return res.status(404).json({ success: false, message: 'User not found' });
        
        if (userToUpdate.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block admin' });

        userToUpdate.isActive = !userToUpdate.isActive;
        await userToUpdate.save();

        res.json({ success: true, message: `User ${userToUpdate.isActive ? 'unblocked' : 'blocked'} successfully!`, status: userToUpdate.isActive ? 'Active' : 'Blocked' });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// User Transactions (Passbook) Route
app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const transactions = await Transaction.find({ memberId: req.user.memberId }).sort({ createdAt: -1 });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Admin: Get all pending withdrawals
app.get('/api/admin/withdrawals', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const Withdrawal = require('./models/Withdrawal');
        const pending = await Withdrawal.find({ status: 'Pending' }).sort({ requestDate: -1 });
        res.json({ success: true, data: pending });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching withdrawals" });
    }
});

// Admin: Approve or Reject Withdrawal
app.post('/api/admin/withdrawals/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const { action } = req.body; // 'approve' or 'reject'
        const Withdrawal = require('./models/Withdrawal');
        
        const request = await Withdrawal.findById(req.params.id);
        if (!request || request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Invalid or already processed request.' });
        }

        if (action === 'approve') {
            request.status = 'Approved';
            request.processDate = Date.now();
            await request.save();
        } else if (action === 'reject') {
            request.status = 'Rejected';
            request.processDate = Date.now();
            await request.save();
            
            // Refund the user
            const user = await User.findById(request.userId);
            if (user) {
                user.mainWallet += request.grossAmount;
                await user.save();

                const Transaction = require('./models/Transaction');
                await Transaction.create({
                    userId: user._id,
                    memberId: user.memberId,
                    amount: request.grossAmount,
                    type: 'Credit',
                    category: 'Refund',
                    remark: `Withdrawal request rejected and refunded.`
                });
            }
        }

        res.json({ success: true, message: `Withdrawal ${action}d successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Binary Tree API
app.get('/api/network/tree/:memberId?', authMiddleware, async (req, res) => {
    try {
        const rootMemberId = req.params.memberId || req.user.memberId;
        
        // Fetch up to 3 levels deep recursively
        async function fetchNode(memberId, level) {
            if (!memberId || level > 3) return null;
            const user = await User.findOne({ memberId: memberId.toUpperCase() });
            if (!user) return null;
            
            return {
                id: user.memberId,
                name: user.name,
                rank: user.rank || (user.isGold ? 'GOLD' : 'STARTER'),
                isActive: user.isActive,
                leftTeamCount: user.leftTeamCount,
                rightTeamCount: user.rightTeamCount,
                left: await fetchNode(user.leftUpline, level + 1),
                right: await fetchNode(user.rightUpline, level + 1)
            };
        }

        const treeData = await fetchNode(rootMemberId, 1);
        if (!treeData) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({ success: true, data: treeData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching tree" });
    }
});

// My Network (Direct Referrals) API
app.get('/api/network/directs', authMiddleware, async (req, res) => {
    try {
        const directs = await User.find({ sponsorId: req.user.memberId })
                                  .select('memberId name mobile joinDate isActive isGold')
                                  .sort({ joinDate: -1 });
        
        const data = directs.map(user => ({
            id: user.memberId,
            name: user.name,
            mobile: user.mobile,
            joinDate: new Date(user.joinDate).toLocaleDateString(),
            status: user.isActive ? 'Active' : 'Blocked',
            rank: user.isGold ? 'Gold' : 'Starter'
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching directs" });
    }
});

// Rebirth IDs API
app.get('/api/network/rebirths', authMiddleware, async (req, res) => {
    try {
        const rebirths = await User.find({ mainUserId: req.user.id, isRebirth: true })
                                   .select('memberId name joinDate leftTeamCount rightTeamCount totalEarnings')
                                   .sort({ joinDate: -1 });
        
        const data = rebirths.map(user => ({
            id: user.memberId,
            name: user.name,
            joinDate: new Date(user.joinDate).toLocaleDateString(),
            leftTeam: user.leftTeamCount,
            rightTeam: user.rightTeamCount,
            earnings: user.totalEarnings
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching rebirths" });
    }
});

// Get User Profile & KYC
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user, hasTpin: !!user.tpin });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching profile" });
    }
});

// Set / Change T-PIN
app.post('/api/user/tpin', authMiddleware, async (req, res) => {
    try {
        const { currentTpin, newTpin } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.tpin && user.tpin !== currentTpin) {
            return res.status(400).json({ success: false, message: "Incorrect current T-PIN" });
        }
        
        user.tpin = newTpin;
        await user.save();
        res.json({ success: true, message: "T-PIN updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error updating T-PIN" });
    }
});

// Update User KYC
app.post('/api/user/kyc', authMiddleware, async (req, res) => {
    try {
        const { panNumber, aadharNumber, bankName, accountNumber, ifscCode } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // Cannot edit if already approved
        if (user.kycStatus === 'Approved') {
            return res.status(400).json({ success: false, message: 'KYC is already approved and cannot be edited.' });
        }

        user.panNumber = panNumber || user.panNumber;
        user.aadharNumber = aadharNumber || user.aadharNumber;
        user.bankName = bankName || user.bankName;
        user.accountNumber = accountNumber || user.accountNumber;
        user.ifscCode = ifscCode || user.ifscCode;
        user.kycStatus = 'Submitted'; // Mark as submitted for admin review

        await user.save();
        res.json({ success: true, message: 'KYC Details Submitted Successfully!', user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error updating KYC" });
    }
});

// Admin: Fetch pending KYC requests
app.get('/api/admin/kyc', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const users = await User.find({ kycStatus: 'Submitted' }).select('memberId name panNumber aadharNumber bankName accountNumber ifscCode kycStatus');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching KYC requests" });
    }
});

// Admin: Approve/Reject KYC
app.post('/api/admin/kyc/:memberId', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const { action } = req.body; // 'approve' or 'reject'
        const user = await User.findOne({ memberId: req.params.memberId });
        
        if (!user || user.kycStatus !== 'Submitted') {
            return res.status(400).json({ success: false, message: 'Invalid or already processed request.' });
        }

        user.kycStatus = action === 'approve' ? 'Approved' : 'Rejected';
        await user.save();

        res.json({ success: true, message: `KYC ${action}d successfully for ${user.memberId}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error processing KYC" });
    }
});

// Master list of rewards
const REWARDS_PLAN = [
    { pairs: 50, name: "Smartphone", cash: 5000 },
    { pairs: 150, name: "Smart TV / Laptop", cash: 15000 },
    { pairs: 500, name: "Bike Fund", cash: 50000 },
    { pairs: 1500, name: "Royal Enfield / Gold", cash: 150000 },
    { pairs: 5000, name: "Car Fund", cash: 500000 },
    { pairs: 15000, name: "Luxury Car Fund", cash: 1500000 },
    { pairs: 50000, name: "Dream Villa", cash: 5000000 }
];

// Get User Rewards Status
app.get('/api/user/rewards', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('totalPairsMatched claimedRewards');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        res.json({
            success: true,
            totalPairsMatched: user.totalPairsMatched,
            claimedRewards: user.claimedRewards,
            rewardsPlan: REWARDS_PLAN
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching rewards" });
    }
});

// --- Withdrawals API ---
app.post('/api/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount, tpin } = req.body;
        const requestedAmount = Number(amount);

        const user = await User.findById(req.user.id);
        
        if (!user.tpin || user.tpin !== tpin) {
            return res.status(400).json({ success: false, message: "Invalid Transaction PIN (T-PIN)." });
        }

        if (user.kycStatus !== 'Approved') {
            return res.status(400).json({ success: false, message: "KYC must be Approved to make a withdrawal. Please update Bank Settings." });
        }

        const SystemSetting = require('./models/SystemSetting');
        let settings = await SystemSetting.findOne();
        const minWithdrawal = settings ? settings.minimumWithdrawal : 500; // Updated to 500 based on rules

        if (!requestedAmount || requestedAmount < minWithdrawal) {
            return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ₹${minWithdrawal}.` });
        }

        if (user.mainWallet < requestedAmount) {
            return res.status(400).json({ success: false, message: "Insufficient main wallet balance." });
        }

        const tds = settings ? settings.tdsPercentage : 5;
        const adminCharge = settings ? settings.adminChargePercentage : 5;
        
        const tdsAmount = (requestedAmount * tds) / 100;
        const adminChargeAmount = (requestedAmount * adminCharge) / 100;
        const netAmount = requestedAmount - (tdsAmount + adminChargeAmount);

        // Deduct from wallet
        user.mainWallet -= requestedAmount;
        await user.save();

        const Withdrawal = require('./models/Withdrawal');
        await Withdrawal.create({
            userId: user._id,
            memberId: user.memberId,
            grossAmount: requestedAmount,
            tdsAmount,
            adminChargeAmount,
            netAmount,
            status: 'Pending' // Admin needs to manually transfer money and approve
        });

        const Transaction = require('./models/Transaction');
        await Transaction.create({
            userId: user._id,
            memberId: user.memberId,
            type: 'Debit',
            amount: requestedAmount,
            description: `Withdrawal Request (Net: ₹${netAmount})`
        });

        res.json({ success: true, message: `Withdrawal of ₹${requestedAmount} requested successfully.`, newBalance: user.mainWallet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error processing withdrawal." });
    }
});

app.get('/api/admin/withdrawals', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const Withdrawal = require('./models/Withdrawal');
        const withdrawals = await Withdrawal.find().sort({ requestDate: -1 });
        res.json({ success: true, data: withdrawals });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching withdrawals" }); }
});

app.post('/api/admin/withdrawals/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { action } = req.body;
        const Withdrawal = require('./models/Withdrawal');
        const withdrawal = await Withdrawal.findById(req.params.id);
        
        if(!withdrawal) return res.status(404).json({ success: false, message: "Request not found" });
        if(withdrawal.status !== 'Pending') return res.status(400).json({ success: false, message: "Already processed" });
        
        if (action === 'approve') {
            withdrawal.status = 'Approved';
            withdrawal.processDate = new Date();
            await withdrawal.save();
            return res.json({ success: true, message: "Withdrawal marked as Paid." });
        } else {
            // Reject - refund the gross amount to user
            withdrawal.status = 'Rejected';
            withdrawal.processDate = new Date();
            await withdrawal.save();
            
            await User.findByIdAndUpdate(withdrawal.userId, {
                $inc: { mainWallet: withdrawal.grossAmount }
            });
            
            const Transaction = require('./models/Transaction');
            await Transaction.create({
                userId: withdrawal.userId,
                memberId: withdrawal.memberId,
                type: 'Credit',
                amount: withdrawal.grossAmount,
                description: `Withdrawal Rejected (Refund)`
            });
            
            return res.json({ success: true, message: "Withdrawal rejected and amount refunded." });
        }
    } catch (err) { res.status(500).json({ success: false, message: "Error processing request" }); }
});

// Claim Reward
app.post('/api/user/rewards/claim', authMiddleware, async (req, res) => {
    try {
        const { pairs } = req.body;
        const user = await User.findById(req.user.id);
        
        const rewardConfig = REWARDS_PLAN.find(r => r.pairs === pairs);
        if (!rewardConfig) return res.status(400).json({ success: false, message: 'Invalid reward tier' });

        if (user.totalPairsMatched < rewardConfig.pairs) {
            return res.status(400).json({ success: false, message: `You need ${rewardConfig.pairs} pairs to claim this reward.` });
        }

        const alreadyClaimed = user.claimedRewards.some(r => r.pairs === pairs);
        if (alreadyClaimed) {
            return res.status(400).json({ success: false, message: 'Reward already claimed.' });
        }

        // Add to claimed array
        user.claimedRewards.push({
            pairs: rewardConfig.pairs,
            rewardName: rewardConfig.name,
            amount: rewardConfig.cash
        });

        // Add income via MLM Logic (distributes 80/20 if we use addIncome, BUT rewards are lifetime cash bonus!
        // The business plan doesn't specify if rewards go through 80/20 rebirth split. 
        // Usually rewards are 100% credited to main wallet or given as cash/gift. Let's credit to mainWallet directly to avoid Rebirth deduction on Gifts.
        user.mainWallet += rewardConfig.cash;
        user.totalEarnings += rewardConfig.cash;
        
        await user.save();

        const Transaction = require('./models/Transaction');
        await Transaction.create({
            memberId: user.memberId,
            type: 'Credit',
            category: 'REWARD',
            remark: `${rewardConfig.name} Reward Claimed (${rewardConfig.pairs} Pairs)`,
            amount: rewardConfig.cash,
            status: 'COMPLETED',
            date: new Date()
        });

        res.json({ success: true, message: `Congratulations! ${rewardConfig.name} cash value added to your Main Wallet.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error claiming reward" });
    }
});

// P2P Transfer API
app.post('/api/p2p', authMiddleware, async (req, res) => {
    try {
        const { receiverId, amount, tpin } = req.body;
        const transferAmount = Number(amount);

        if (!receiverId || transferAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount or receiver ID" });
        }

        const sender = await User.findById(req.user.id);
        if (!sender) return res.status(404).json({ success: false, message: "Sender not found" });

        if (!sender.tpin || sender.tpin !== tpin) {
            return res.status(400).json({ success: false, message: "Invalid Transaction PIN (T-PIN)." });
        }

        if (sender.memberId === receiverId) {
            return res.status(400).json({ success: false, message: "You cannot transfer to yourself" });
        }

        if (sender.mainWallet < transferAmount) {
            return res.status(400).json({ success: false, message: "Insufficient balance for transfer" });
        }

        const receiver = await User.findOne({ memberId: receiverId, isRebirth: false });
        if (!receiver) {
            return res.status(404).json({ success: false, message: "Receiver not found or is a Rebirth ID" });
        }

        // 5% P2P Charge
        const adminCharge = transferAmount * 0.05;
        const finalAmountForReceiver = transferAmount - adminCharge;

        // Deduct from Sender
        sender.mainWallet -= transferAmount;
        await sender.save();

        // Add to Receiver
        receiver.mainWallet += finalAmountForReceiver;
        receiver.totalEarnings += finalAmountForReceiver; // Optional: whether P2P counts as earnings
        await receiver.save();

        // Create Transactions
        const Transaction = require('./models/Transaction');
        
        // Sender Debit Transaction
        await Transaction.create({
            memberId: sender.memberId,
            type: 'Debit',
            category: 'P2P_TRANSFER',
            remark: `P2P Transfer to ${receiver.name} (${receiverId})`,
            amount: transferAmount,
            status: 'COMPLETED',
            date: new Date()
        });

        // Receiver Credit Transaction
        await Transaction.create({
            memberId: receiver.memberId,
            type: 'Credit',
            category: 'P2P_RECEIVE',
            remark: `P2P Received from ${sender.name} (${sender.memberId}) - 5% Charge applied`,
            amount: finalAmountForReceiver,
            status: 'COMPLETED',
            date: new Date()
        });

        res.json({ 
            success: true, 
            message: `Successfully transferred ₹${transferAmount} to ${receiver.name}.`,
            newBalance: sender.mainWallet
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error during P2P transfer" });
    }
});

// --- Fund Requests API ---
app.post('/api/fund-request', authMiddleware, async (req, res) => {
    try {
        const { amount, utrNumber, receiptUrl } = req.body;
        if (!amount || !utrNumber) return res.status(400).json({ success: false, message: "Amount and UTR Number are required." });

        const FundRequest = require('./models/FundRequest');
        await FundRequest.create({
            userId: req.user.id,
            memberId: req.user.memberId,
            amount: Number(amount),
            utrNumber,
            receiptUrl
        });

        res.json({ success: true, message: "Fund request submitted successfully. Waiting for admin approval." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error creating fund request" });
    }
});

app.get('/api/admin/fund-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const FundRequest = require('./models/FundRequest');
        const requests = await FundRequest.find({ status: 'Pending' }).sort({ requestDate: -1 });
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching requests" });
    }
});

app.post('/api/admin/fund-requests/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const FundRequest = require('./models/FundRequest');
        const request = await FundRequest.findById(req.params.id);
        
        if (!request || request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Invalid or already processed request.' });
        }

        if (action === 'approve') {
            request.status = 'Approved';
            request.processDate = new Date();
            await request.save();

            const user = await User.findById(request.userId);
            if (user) {
                user.mainWallet += request.amount;
                await user.save();

                const Transaction = require('./models/Transaction');
                await Transaction.create({
                    memberId: user.memberId,
                    type: 'Credit',
                    category: 'DEPOSIT',
                    remark: `Fund Request Approved (UTR: ${request.utrNumber})`,
                    amount: request.amount,
                    status: 'COMPLETED',
                    date: new Date()
                });
            }
        } else if (action === 'reject') {
            request.status = 'Rejected';
            request.processDate = new Date();
            await request.save();
        }

        res.json({ success: true, message: `Fund request ${action}d successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error processing request" });
    }
});

// --- Royalty Pools API ---
app.get('/api/admin/pools', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const GlobalPool = require('./models/GlobalPool');
        const pools = await GlobalPool.find().lean();
        
        const poolStats = pools.map(pool => ({
            _id: pool._id,
            poolName: pool.poolName,
            totalFund: pool.totalFund,
            membersCount: pool.activeQueue ? pool.activeQueue.length : 0
        }));
        res.json({ success: true, data: poolStats });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching pools" }); }
});

// --- Support Tickets API ---
app.post('/api/tickets', authMiddleware, async (req, res) => {
    try {
        const { subject, message } = req.body;
        const SupportTicket = require('./models/SupportTicket');
        await SupportTicket.create({
            userId: req.user.id,
            memberId: req.user.memberId,
            subject,
            message
        });
        res.json({ success: true, message: "Ticket created successfully!" });
    } catch (err) { res.status(500).json({ success: false, message: "Error creating ticket" }); }
});

app.get('/api/tickets', authMiddleware, async (req, res) => {
    try {
        const SupportTicket = require('./models/SupportTicket');
        const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: tickets });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching tickets" }); }
});

app.get('/api/admin/tickets', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const SupportTicket = require('./models/SupportTicket');
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.json({ success: true, data: tickets });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching tickets" }); }
});

app.post('/api/admin/tickets/:id/reply', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { reply } = req.body;
        const SupportTicket = require('./models/SupportTicket');
        const ticket = await SupportTicket.findById(req.params.id);
        if(!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
        
        ticket.reply = reply;
        ticket.status = 'Resolved';
        ticket.replyDate = new Date();
        await ticket.save();
        res.json({ success: true, message: "Reply sent successfully!" });
    } catch (err) { res.status(500).json({ success: false, message: "Error replying to ticket" }); }
});

// --- System Settings API ---
app.get('/api/settings', async (req, res) => {
    try {
        const SystemSetting = require('./models/SystemSetting');
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching settings" }); }
});

app.post('/api/admin/settings', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const SystemSetting = require('./models/SystemSetting');
        let settings = await SystemSetting.findOne();
        if (!settings) settings = new SystemSetting();
        
        settings.siteName = req.body.siteName ?? settings.siteName;
        settings.tdsPercentage = req.body.tdsPercentage ?? settings.tdsPercentage;
        settings.adminChargePercentage = req.body.adminChargePercentage ?? settings.adminChargePercentage;
        settings.minimumWithdrawal = req.body.minimumWithdrawal ?? settings.minimumWithdrawal;
        settings.maintenanceMode = req.body.maintenanceMode ?? settings.maintenanceMode;
        
        await settings.save();
        res.json({ success: true, message: "Settings updated successfully!", data: settings });
    } catch (err) { res.status(500).json({ success: false, message: "Error saving settings" }); }
});

// --- Fund Requests API ---
app.post('/api/fund-request', authMiddleware, async (req, res) => {
    try {
        const { amount, utrNumber } = req.body;
        if (!amount || amount < 100) return res.status(400).json({ success: false, message: "Minimum deposit is ₹100" });
        if (!utrNumber) return res.status(400).json({ success: false, message: "UTR Number is required" });
        
        const FundRequest = require('./models/FundRequest');
        await FundRequest.create({
            userId: req.user.id,
            memberId: req.user.memberId,
            amount: Number(amount),
            utrNumber,
            status: 'Pending'
        });
        res.json({ success: true, message: "Fund request submitted successfully! Pending admin approval." });
    } catch (err) { res.status(500).json({ success: false, message: "Error submitting request" }); }
});

app.get('/api/admin/fund-requests', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const FundRequest = require('./models/FundRequest');
        const requests = await FundRequest.find({ status: 'Pending' }).sort({ requestDate: -1 });
        res.json({ success: true, data: requests });
    } catch (err) { res.status(500).json({ success: false, message: "Error fetching fund requests" }); }
});

app.post('/api/admin/fund-requests/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { action } = req.body;
        const FundRequest = require('./models/FundRequest');
        const User = require('./models/User');
        
        const request = await FundRequest.findById(req.params.id);
        if(!request) return res.status(404).json({ success: false, message: "Request not found" });
        if(request.status !== 'Pending') return res.status(400).json({ success: false, message: "Request already processed" });
        
        if (action === 'approve') {
            request.status = 'Approved';
            request.processDate = new Date();
            await request.save();
            
            await User.findByIdAndUpdate(request.userId, {
                $inc: { mainWallet: request.amount }
            });
            return res.json({ success: true, message: `₹${request.amount} approved and added to ${request.memberId}'s wallet.` });
        } else {
            request.status = 'Rejected';
            request.processDate = new Date();
            await request.save();
            return res.json({ success: true, message: "Fund request rejected." });
        }
    } catch (err) { console.error(err); res.status(500).json({ success: false, message: "Error processing request" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Secure Backend Server is running on port ${PORT}`));
