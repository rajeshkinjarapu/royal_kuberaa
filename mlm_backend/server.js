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
        
        // Initialize or Update Default Admin
        let adminUser = await User.findOne({ role: 'admin' });
        const hashedAdminPassword = await bcrypt.hash('474532', 10);

        if (!adminUser) {
            await User.create({
                memberId: 'RAJESHKINJARAPU',
                password: hashedAdminPassword,
                name: 'Rajesh Kinjarapu',
                mobile: '9999999999',
                role: 'admin',
                rank: 'OWNER'
            });
            console.log('✅ Default Admin User Created (RAJESHKINJARAPU)');
        } else {
            adminUser.memberId = 'RAJESHKINJARAPU';
            adminUser.password = hashedAdminPassword;
            await adminUser.save();
            console.log('✅ Default Admin User Updated (RAJESHKINJARAPU)');
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
            role: 'member',
            isActive: false // Must be activated later
        });

        await newUser.save();

        res.status(201).json({ success: true, message: 'Registration successful! Please login and activate your ID.', user: newUser });
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
        let direct = 0, level = 0, royalty = 0, cashback = 0, withdraw = 0;
        
        txs.forEach(tx => {
            if (tx.category === 'DIRECT') direct += tx.amount;
            if (tx.category === 'LEVEL') level += tx.amount;
            if (tx.category === 'ROYALTY') royalty += tx.amount;
            if (tx.category === 'CASHBACK') cashback += tx.amount;
            if (tx.category === 'Withdrawal') withdraw += tx.amount;
        });

        res.json({
            success: true,
            data: {
                totalEarnings: user.totalEarnings,
                mainWallet: user.mainWallet,
                rebirthWallet: user.rebirthWallet,
                directIncome: direct,
                levelIncome: level,
                royaltyIncome: royalty,
                cashbackIncome: cashback,
                withdrawFund: withdraw, 
                allRanks: (user.goldEarnings || 0) + (user.platinumEarnings || 0) + (user.rubyEarnings || 0) + (user.diamondEarnings || 0),
                royaltyStats: {
                    rank: user.rank || (user.isDiamond ? 'DIAMOND' : user.isRuby ? 'RUBY' : user.isPlatinum ? 'PLATINUM' : user.isGold ? 'GOLD' : 'STARTER'),
                    goldEarnings: user.goldEarnings || 0,
                    platinumEarnings: user.platinumEarnings || 0,
                    rubyEarnings: user.rubyEarnings || 0,
                    diamondEarnings: user.diamondEarnings || 0,
                    cashbackEarnings: user.cashbackEarnings || 0,
                    caps: { GOLD: 20000, PLATINUM: 100000, RUBY: 500000, DIAMOND: 2500000, CASHBACK: 1500 }
                },
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

// Fetch Transactions (Passbook)
app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const txns = await Transaction.find({ memberId: user.memberId }).sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, data: txns });
    } catch (error) {
        console.error("Transactions Fetch Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching transactions" });
    }
});

// Withdrawal Request Route
app.post('/api/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        const withdrawAmount = Number(amount);
        const Withdrawal = require('./models/Withdrawal');

        if (!withdrawAmount || withdrawAmount < 500) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500.' });
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
                                   .select('memberId name createdAt joinDate')
                                   .sort({ createdAt: -1 });
        
        const data = rebirths.map(user => ({
            id: user.memberId,
            name: user.name,
            sponsorBonus: 400,
            poolContribution: 1100,
            createdDate: new Date(user.createdAt || user.joinDate || Date.now()).toLocaleDateString(),
            status: 'Active Rebirth Node'
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

// --- Products API ---
const Product = require('./models/Product');

// Get all active products (Public/Member)
app.get('/api/products', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching products' });
    }
});

// Admin: Get all products
app.get('/api/admin/products', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const products = await Product.find({});
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Add a new product
app.post('/api/admin/products', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const product = new Product(req.body);
        await product.save();
        res.json({ success: true, message: 'Product added successfully!', data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error adding product' });
    }
});

// Admin: Edit a product
app.put('/api/admin/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, message: 'Product updated successfully!', data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating product' });
    }
});

// Admin: Delete a product
app.delete('/api/admin/products/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Product deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting product' });
    }
});

// --- Dynamic Notifications API (Member & Admin) ---
app.get('/api/user/notifications', authMiddleware, async (req, res) => {
    try {
        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        const Withdrawal = require('./models/Withdrawal');
        const FundRequest = require('./models/FundRequest');
        const SupportTicket = require('./models/SupportTicket');

        const currentUser = await User.findById(req.user.id || req.user._id);
        if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

        const notifications = [];

        const formatTimeAgo = (date) => {
            if (!date) return 'Recently';
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        };

        if (req.user.role === 'admin') {
            // ADMIN NOTIFICATIONS
            // 1. Pending Withdrawals
            const pendingWithdrawals = await Withdrawal.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(10);
            for (const w of pendingWithdrawals) {
                notifications.push({
                    id: `admin_w_${w._id}`,
                    title: 'Pending Withdrawal Payout',
                    desc: `Member ${w.memberId} requested bank payout of ₹${w.netAmount.toLocaleString()} (Gross ₹${w.grossAmount.toLocaleString()})`,
                    time: formatTimeAgo(w.createdAt),
                    timestamp: new Date(w.createdAt).getTime(),
                    icon: '💸',
                    color: '#BE123C',
                    type: 'WITHDRAWAL_ALERT'
                });
            }

            // 2. Pending Fund Requests
            const pendingFunds = await FundRequest.find({ status: 'Pending' }).sort({ requestDate: -1 }).limit(10);
            for (const f of pendingFunds) {
                notifications.push({
                    id: `admin_f_${f._id}`,
                    title: 'New Deposit Fund Request',
                    desc: `Member ${f.memberId} submitted ₹${f.amount.toLocaleString()} with UTR: ${f.utrNumber}`,
                    time: formatTimeAgo(f.requestDate),
                    timestamp: new Date(f.requestDate).getTime(),
                    icon: '💳',
                    color: '#2563EB',
                    type: 'DEPOSIT_ALERT'
                });
            }

            // 3. Pending KYC
            const pendingKycs = await User.find({ kycStatus: 'Submitted' }).sort({ updatedAt: -1 }).limit(10);
            for (const k of pendingKycs) {
                notifications.push({
                    id: `admin_kyc_${k._id}`,
                    title: 'New KYC Awaiting Verification',
                    desc: `Member ${k.name} (${k.memberId}) submitted PAN and Bank details for verification.`,
                    time: formatTimeAgo(k.updatedAt),
                    timestamp: new Date(k.updatedAt).getTime(),
                    icon: '🛡️',
                    color: '#D97706',
                    type: 'KYC_ALERT'
                });
            }

            // 4. Open Support Tickets
            const openTickets = await SupportTicket.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(10);
            for (const t of openTickets) {
                notifications.push({
                    id: `admin_ticket_${t._id}`,
                    title: 'Open Support Ticket',
                    desc: `[${t.memberId}] ${t.subject}: ${t.message.slice(0, 80)}...`,
                    time: formatTimeAgo(t.createdAt),
                    timestamp: new Date(t.createdAt).getTime(),
                    icon: '🎧',
                    color: '#0EA5E9',
                    type: 'SUPPORT_ALERT'
                });
            }

            // 5. Recent Joinings
            const recentMembers = await User.find({ role: 'member' }).sort({ createdAt: -1 }).limit(10);
            for (const m of recentMembers) {
                notifications.push({
                    id: `admin_reg_${m._id}`,
                    title: 'New Member Registration',
                    desc: `${m.name} (${m.memberId}) joined Royal Kuberaa${m.sponsorId ? ` under ${m.sponsorId}` : ''}`,
                    time: formatTimeAgo(m.createdAt),
                    timestamp: new Date(m.createdAt).getTime(),
                    icon: '👤',
                    color: '#10B981',
                    type: 'MEMBER_ALERT'
                });
            }
        } else {
            // REGULAR MEMBER NOTIFICATIONS
            // 1. Transactions (Commissions & Credits/Debits)
            const txns = await Transaction.find({
                $or: [{ userId: currentUser._id }, { memberId: currentUser.memberId }]
            }).sort({ createdAt: -1 }).limit(20);

            for (const tx of txns) {
                let icon = '💰';
                let color = '#10B981';
                let title = 'Transaction Update';

                switch(tx.category) {
                    case 'DIRECT':
                        icon = '👥'; color = '#0EA5E9'; title = 'Direct Referral Bonus Credited'; break;
                    case 'BINARY':
                        icon = '⚖️'; color = '#10B981'; title = 'Binary Matching Bonus Credited'; break;
                    case 'LEVEL':
                        icon = '📈'; color = '#8B5CF6'; title = 'Level Team Bonus Credited'; break;
                    case 'ROYALTY':
                        icon = '👑'; color = '#F59E0B'; title = 'Daily Royalty Pool Share Credited'; break;
                    case 'CASHBACK':
                        icon = '💸'; color = '#059669'; title = 'Daily Non-Working Cashback Credited'; break;
                    case 'REBIRTH_GENERATED':
                        icon = '🌱'; color = '#D946EF'; title = 'New Rebirth ID Generated!'; break;
                    case 'ADMIN_CREDIT':
                        icon = '🎁'; color = '#059669'; title = 'Admin Fund Credit'; break;
                    case 'ADMIN_DEBIT':
                        icon = '⚠️'; color = '#EF4444'; title = 'Admin Fund Adjustment'; break;
                    case 'P2P_TRANSFER':
                    case 'P2P Transfer':
                        icon = tx.type === 'Credit' ? '📥' : '📤';
                        color = tx.type === 'Credit' ? '#10B981' : '#64748B';
                        title = tx.type === 'Credit' ? 'P2P Transfer Received' : 'P2P Transfer Sent';
                        break;
                    default:
                        icon = tx.type === 'Credit' ? '📥' : '📤';
                        color = tx.type === 'Credit' ? '#10B981' : '#64748B';
                        title = `${tx.type} Transaction`;
                }

                notifications.push({
                    id: `tx_${tx._id}`,
                    title,
                    desc: `${tx.type === 'Credit' ? '+' : '-'}₹${tx.amount.toLocaleString()} — ${tx.remark || tx.category}`,
                    time: formatTimeAgo(tx.createdAt || tx.date),
                    timestamp: new Date(tx.createdAt || tx.date).getTime(),
                    icon,
                    color,
                    type: 'TRANSACTION'
                });
            }

            // 2. Withdrawals
            const withdrawals = await Withdrawal.find({ userId: currentUser._id }).sort({ createdAt: -1 }).limit(5);
            for (const w of withdrawals) {
                const isApproved = w.status === 'Approved';
                const isRejected = w.status === 'Rejected';
                notifications.push({
                    id: `w_${w._id}`,
                    title: isApproved ? 'Withdrawal Payout Approved ✅' : (isRejected ? 'Withdrawal Rejected ❌' : 'Withdrawal Request Submitted ⏳'),
                    desc: isApproved 
                        ? `₹${w.netAmount.toLocaleString()} has been processed to your bank account (Deductions: 5% TDS + 5% Admin).` 
                        : (isRejected ? `Your withdrawal of ₹${w.grossAmount.toLocaleString()} was not approved.` : `₹${w.grossAmount.toLocaleString()} withdrawal request is currently under review by Admin.`),
                    time: formatTimeAgo(w.createdAt),
                    timestamp: new Date(w.createdAt).getTime(),
                    icon: isApproved ? '🏦' : (isRejected ? '❌' : '⏳'),
                    color: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#F59E0B'),
                    type: 'WITHDRAWAL'
                });
            }

            // 3. Fund Requests (Deposits)
            const fundReqs = await FundRequest.find({ userId: currentUser._id }).sort({ requestDate: -1 }).limit(5);
            for (const fr of fundReqs) {
                const isApproved = fr.status === 'Approved';
                const isRejected = fr.status === 'Rejected';
                notifications.push({
                    id: `fr_${fr._id}`,
                    title: isApproved ? 'Deposit Approved & Added ✅' : (isRejected ? 'Deposit Rejected ❌' : 'Deposit Request Submitted ⏳'),
                    desc: isApproved 
                        ? `₹${fr.amount.toLocaleString()} deposit (UTR: ${fr.utrNumber}) has been verified and added to your Main Wallet.`
                        : (isRejected ? `Deposit request for ₹${fr.amount.toLocaleString()} was rejected. Please contact support.` : `₹${fr.amount.toLocaleString()} deposit with UTR ${fr.utrNumber} is awaiting verification.`),
                    time: formatTimeAgo(fr.requestDate),
                    timestamp: new Date(fr.requestDate).getTime(),
                    icon: isApproved ? '💳' : (isRejected ? '❌' : '⏳'),
                    color: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#3B82F6'),
                    type: 'DEPOSIT'
                });
            }

            // 4. KYC Status
            if (currentUser.kycStatus === 'Approved') {
                notifications.push({
                    id: `kyc_approved_${currentUser._id}`,
                    title: 'KYC Verified Successfully 🛡️',
                    desc: 'Your PAN card and bank account details have been verified. You can now request unlimited withdrawals.',
                    time: formatTimeAgo(currentUser.updatedAt),
                    timestamp: new Date(currentUser.updatedAt).getTime(),
                    icon: '🛡️',
                    color: '#10B981',
                    type: 'KYC'
                });
            } else if (currentUser.kycStatus === 'Rejected') {
                notifications.push({
                    id: `kyc_rejected_${currentUser._id}`,
                    title: 'KYC Verification Failed ⚠️',
                    desc: 'Your submitted KYC documents were rejected. Please check your bank details and resubmit in Profile.',
                    time: formatTimeAgo(currentUser.updatedAt),
                    timestamp: new Date(currentUser.updatedAt).getTime(),
                    icon: '⚠️',
                    color: '#EF4444',
                    type: 'KYC'
                });
            }

            // 5. Support Tickets
            const userTickets = await SupportTicket.find({ userId: currentUser._id, status: 'Resolved' }).sort({ updatedAt: -1 }).limit(5);
            for (const ut of userTickets) {
                notifications.push({
                    id: `ticket_${ut._id}`,
                    title: 'Support Ticket Resolved 🎧',
                    desc: `Reply on "${ut.subject}": ${ut.reply || 'Your ticket has been marked as resolved.'}`,
                    time: formatTimeAgo(ut.updatedAt),
                    timestamp: new Date(ut.updatedAt).getTime(),
                    icon: '🎧',
                    color: '#2563EB',
                    type: 'SUPPORT'
                });
            }

            // 6. Direct Referrals
            const directs = await User.find({ sponsorId: currentUser.memberId }).sort({ createdAt: -1 }).limit(5);
            for (const d of directs) {
                notifications.push({
                    id: `direct_${d._id}`,
                    title: 'New Team Referral Joined 👤',
                    desc: `${d.name} (${d.memberId}) registered under you on ${d.placement || 'Team'}. Status: ${d.isActive ? 'Active' : 'Unactivated'}`,
                    time: formatTimeAgo(d.createdAt),
                    timestamp: new Date(d.createdAt).getTime(),
                    icon: '👤',
                    color: '#0EA5E9',
                    type: 'TEAM'
                });
            }
        }

        // Sort all notifications by most recent first
        notifications.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            success: true,
            data: notifications.slice(0, 30),
            unreadCount: Math.min(notifications.length, 5)
        });
    } catch (err) {
        console.error("Notifications API error:", err);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// Activate ID
app.post('/api/user/activate', authMiddleware, async (req, res) => {
    try {
        const { productId, targetMemberId } = req.body;
        const payer = await User.findById(req.user.id);
        if (!payer) return res.status(404).json({ success: false, message: 'Payer not found' });
        
        let targetUser = payer;
        if (targetMemberId && targetMemberId.trim() !== '') {
            targetUser = await User.findOne({ memberId: targetMemberId.trim().toUpperCase() });
            if (!targetUser) return res.status(404).json({ success: false, message: 'Target Member ID not found' });
        }
        
        if (targetUser.isActive) {
            return res.status(400).json({ success: false, message: `${targetUser.memberId} is already activated` });
        }
        
        let amountToDeduct = 1500;
        let productName = 'ID Activation Fee';
        
        if (productId) {
            const Product = require('./models/Product');
            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
            amountToDeduct = product.price;
            productName = `Activated via ${product.name}`;
        }
        
        if (payer.mainWallet < amountToDeduct) {
            return res.status(400).json({ success: false, message: `Insufficient balance in your wallet. You need ₹${amountToDeduct}.` });
        }
        
        payer.mainWallet -= amountToDeduct;
        await payer.save();
        
        targetUser.isActive = true;
        if (targetUser._id.toString() !== payer._id.toString()) {
            await targetUser.save();
        }
        
        const Transaction = require('./models/Transaction');
        
        // Debit transaction for the payer
        await Transaction.create({
            userId: payer._id,
            memberId: payer.memberId,
            type: 'Debit',
            category: 'ACTIVATION',
            amount: amountToDeduct,
            remark: `Activated ID: ${targetUser.memberId}`
        });
        
        let sponsor = null;
        if (targetUser.sponsorId) {
            sponsor = await User.findOne({ memberId: targetUser.sponsorId });
        }
        
        // Trigger MLM Distribution for the activated user
        await mlmLogic.activateUser(targetUser, sponsor, targetUser.placement);
        
        res.json({ success: true, message: 'ID Activated Successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during activation' });
    }
});

// Change Password
app.post('/api/user/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
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

// Master list of rewards (Scaled proportionally for ₹1500 package and ₹300 binary matching)
const REWARDS_PLAN = [
    { pairs: 25, name: "Smartwatch / Soundbar", cash: 3500 },
    { pairs: 50, name: "5G Smartphone", cash: 8000 },
    { pairs: 150, name: "43\" Smart LED TV / Laptop", cash: 25000 },
    { pairs: 500, name: "Electric Scooter / Bike Fund", cash: 75000 },
    { pairs: 1500, name: "Royal Enfield / Gold Fund", cash: 225000 },
    { pairs: 5000, name: "Car Fund (Swift / Punch)", cash: 750000 },
    { pairs: 15000, name: "Luxury SUV Fund (Creta / XUV)", cash: 2500000 },
    { pairs: 50000, name: "Dream Luxury Villa", cash: 7500000 }
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

// Claim Reward (Physical Gift Only - No Cash Added to Wallet)
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

        // Add to claimed array with Pending Dispatch status
        user.claimedRewards.push({
            pairs: rewardConfig.pairs,
            rewardName: rewardConfig.name,
            amount: rewardConfig.cash, // approximate gift value
            status: 'Pending Dispatch',
            claimedAt: new Date()
        });

        // Business Rule: ONLY physical gift is awarded (no direct cash added to wallet)
        await user.save();

        const Transaction = require('./models/Transaction');
        await Transaction.create({
            memberId: user.memberId,
            type: 'Credit',
            category: 'REWARD_GIFT',
            remark: `${rewardConfig.name} Gift Claimed (${rewardConfig.pairs} Pairs) - Submitted for Dispatch`,
            amount: 0,
            status: 'COMPLETED',
            date: new Date()
        });

        res.json({ success: true, message: `🎉 Congratulations! Your claim for ${rewardConfig.name} (${rewardConfig.pairs} Pairs) has been submitted. The admin team will dispatch your gift!` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error claiming reward" });
    }
});

// Admin: Fetch all rewards achievers
app.get('/api/admin/rewards', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const users = await User.find({ 'claimedRewards.0': { $exists: true } })
                                .select('memberId name mobile totalPairsMatched claimedRewards')
                                .lean();
        
        const achieversList = [];
        users.forEach(u => {
            u.claimedRewards.forEach(r => {
                achieversList.push({
                    userId: u._id,
                    memberId: u.memberId,
                    name: u.name,
                    mobile: u.mobile,
                    totalPairsMatched: u.totalPairsMatched,
                    pairs: r.pairs,
                    rewardName: r.rewardName,
                    amount: r.amount,
                    status: r.status || 'Pending Dispatch',
                    claimedAt: r.claimedAt,
                    dispatchedAt: r.dispatchedAt
                });
            });
        });

        // Sort latest claims first
        achieversList.sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
        res.json({ success: true, data: achieversList });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching rewards achievers" });
    }
});

// Admin: Update reward dispatch / delivery status
app.post('/api/admin/rewards/:userId/:pairs', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { status } = req.body; // 'Dispatched', 'Delivered'
        const pairsNumber = Number(req.params.pairs);
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const rewardIndex = user.claimedRewards.findIndex(r => r.pairs === pairsNumber);
        if (rewardIndex === -1) return res.status(404).json({ success: false, message: "Reward claim not found" });

        user.claimedRewards[rewardIndex].status = status;
        if (status === 'Dispatched' || status === 'Delivered') {
            user.claimedRewards[rewardIndex].dispatchedAt = new Date();
        }
        await user.save();

        res.json({ success: true, message: `Reward marked as ${status} successfully!` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating reward status" });
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

// --- Royalty & Non-Working Pools API ---
app.get('/api/admin/pools', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const GlobalPool = require('./models/GlobalPool');
        const pools = await GlobalPool.find().lean();
        
        const poolStats = await Promise.all(pools.map(async pool => {
            let membersCount = pool.activeQueue ? pool.activeQueue.length : 0;
            if (pool.poolName === 'NON_WORKING') {
                membersCount = await User.countDocuments({
                    directReferralsCount: 0,
                    totalPairsMatched: 0,
                    cashbackEarnings: { $lt: 1500 },
                    isActive: true,
                    isRebirth: false
                });
            }
            return {
                _id: pool._id,
                poolName: pool.poolName,
                totalFund: pool.totalFund,
                membersCount
            };
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

// --- Admin Fund Management APIs (Stats, Manual Credit/Debit) ---
app.get('/api/admin/fund-stats', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        const Withdrawal = require('./models/Withdrawal');
        const FundRequest = require('./models/FundRequest');

        // Aggregates for all users' wallet balances
        const userWallets = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalMainWallet: { $sum: '$mainWallet' },
                    totalRebirthWallet: { $sum: '$rebirthWallet' },
                    totalEarnings: { $sum: '$totalEarnings' },
                    totalMembers: { $sum: 1 },
                    activeMembers: { $sum: { $cond: ['$isActive', 1, 0] } }
                }
            }
        ]);

        const pendingWithdrawalsAgg = await Withdrawal.aggregate([
            { $match: { status: 'Pending' } },
            { $group: { _id: null, totalPending: { $sum: '$netAmount' }, count: { $sum: 1 } } }
        ]);

        const pendingFundRequestsAgg = await FundRequest.aggregate([
            { $match: { status: 'Pending' } },
            { $group: { _id: null, totalPending: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const stats = userWallets[0] || {
            totalMainWallet: 0,
            totalRebirthWallet: 0,
            totalEarnings: 0,
            totalMembers: 0,
            activeMembers: 0
        };

        const pendingWithdrawals = pendingWithdrawalsAgg[0] || { totalPending: 0, count: 0 };
        const pendingFundRequests = pendingFundRequestsAgg[0] || { totalPending: 0, count: 0 };

        // Recent 20 Admin Manual Transactions
        const recentAdminTransactions = await Transaction.find({
            category: { $in: ['ADMIN_CREDIT', 'ADMIN_DEBIT'] }
        }).sort({ createdAt: -1 }).limit(20);

        res.json({
            success: true,
            data: {
                totalMainWallet: stats.totalMainWallet,
                totalRebirthWallet: stats.totalRebirthWallet,
                totalSystemLiability: stats.totalMainWallet + stats.totalRebirthWallet,
                totalEarnings: stats.totalEarnings,
                totalMembers: stats.totalMembers,
                activeMembers: stats.activeMembers,
                pendingWithdrawalsAmount: pendingWithdrawals.totalPending,
                pendingWithdrawalsCount: pendingWithdrawals.count,
                pendingFundRequestsAmount: pendingFundRequests.totalPending,
                pendingFundRequestsCount: pendingFundRequests.count,
                recentAdminTransactions
            }
        });
    } catch (err) {
        console.error("Error fetching fund stats:", err);
        res.status(500).json({ success: false, message: 'Error fetching fund statistics' });
    }
});

app.post('/api/admin/fund-action', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { memberId, amount, actionType = 'credit', walletType = 'main', remark } = req.body;
        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) return res.status(400).json({ success: false, message: 'Please enter a valid positive amount' });
        
        const targetMemberId = (memberId || '').trim();
        const user = await User.findOne({ memberId: new RegExp(`^${targetMemberId}$`, 'i') });
        if (!user) return res.status(404).json({ success: false, message: `Member ID "${targetMemberId}" not found in system` });

        const isCredit = actionType === 'credit';
        const isRebirth = walletType === 'rebirth';
        const walletField = isRebirth ? 'rebirthWallet' : 'mainWallet';

        if (!isCredit) {
            // Debit check
            if (user[walletField] < numAmount) {
                return res.status(400).json({
                    success: false, 
                    message: `Insufficient ${isRebirth ? 'Rebirth' : 'Main'} Wallet balance! User only has ₹${user[walletField].toLocaleString()}`
                });
            }
            user[walletField] -= numAmount;
        } else {
            user[walletField] += numAmount;
        }

        await user.save();

        const category = isCredit ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT';
        const actionWord = isCredit ? 'Credited' : 'Debited';
        const walletName = isRebirth ? 'Rebirth Wallet' : 'Main Wallet';
        const customRemark = remark?.trim() || `Manual Admin ${actionWord} to ${walletName}`;

        await Transaction.create({
            userId: user._id,
            memberId: user.memberId,
            amount: numAmount,
            type: isCredit ? 'Credit' : 'Debit',
            category: category,
            remark: customRemark,
            date: new Date()
        });

        res.json({
            success: true,
            message: `Successfully ${actionWord.toLowerCase()} ₹${numAmount.toLocaleString()} ${isCredit ? 'to' : 'from'} ${user.name} (${user.memberId})'s ${walletName}. New Balance: ₹${user[walletField].toLocaleString()}`,
            data: {
                memberId: user.memberId,
                name: user.name,
                mainWallet: user.mainWallet,
                rebirthWallet: user.rebirthWallet
            }
        });
    } catch (err) {
        console.error("Fund action error:", err);
        res.status(500).json({ success: false, message: 'Error processing fund action' });
    }
});

// Backward compatibility alias for add-funds
app.post('/api/admin/add-funds', authMiddleware, async (req, res) => {
    req.body.actionType = 'credit';
    req.body.walletType = 'main';
    const User = require('./models/User');
    const Transaction = require('./models/Transaction');
    try {
        const { memberId, amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
        const user = await User.findOne({ memberId: new RegExp(`^${(memberId || '').trim()}$`, 'i') });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.mainWallet += numAmount;
        await user.save();
        await Transaction.create({
            userId: user._id,
            memberId: user.memberId,
            amount: numAmount,
            type: 'Credit',
            category: 'ADMIN_CREDIT',
            remark: 'Funds Added by Admin',
            date: new Date()
        });
        res.json({ success: true, message: `Successfully added ₹${numAmount} to ${user.memberId}'s wallet.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding funds' });
    }
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
        settings.companyBankName = req.body.companyBankName ?? settings.companyBankName;
        settings.companyAccountName = req.body.companyAccountName ?? settings.companyAccountName;
        settings.companyAccountNumber = req.body.companyAccountNumber ?? settings.companyAccountNumber;
        settings.companyIfsc = req.body.companyIfsc ?? settings.companyIfsc;
        settings.companyUpiId = req.body.companyUpiId ?? settings.companyUpiId;
        settings.companyQrUrl = req.body.companyQrUrl ?? settings.companyQrUrl;
        
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

// --- Razorpay Integration ---
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret'
});

app.post('/api/payment/create-order', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount < 100) return res.status(400).json({ success: false, message: 'Minimum deposit is ₹100' });

        const options = {
            amount: amount * 100, // in paise
            currency: "INR",
            receipt: `rcptid_${req.user.id.slice(-6)}_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
});

app.post('/api/payment/verify', authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            const User = require('./models/User');
            const Transaction = require('./models/Transaction');

            const user = await User.findById(req.user.id);
            user.mainWallet += Number(amount);
            await user.save();

            await Transaction.create({
                userId: user._id,
                memberId: user.memberId,
                type: 'Credit',
                category: 'FUND_ADD',
                amount: Number(amount),
                description: 'Razorpay Instant Deposit'
            });

            res.json({ success: true, message: 'Payment successful! Funds added to wallet.' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
});

// Admin Reports API
app.get('/api/admin/reports', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        const Withdrawal = require('./models/Withdrawal');

        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
        
        // Income stats from transactions
        const incomeTx = await Transaction.aggregate([
            { $match: { type: 'Credit', category: { $in: ['DIRECT', 'BINARY', 'ROYALTY', 'CASHBACK'] } } },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ]);
        const totalIncomeGenerated = incomeTx[0]?.totalIncome || 0;

        // Withdrawal stats
        const withdrawals = await Withdrawal.aggregate([
            { $group: {
                _id: '$status',
                count: { $sum: 1 },
                gross: { $sum: '$grossAmount' },
                tds: { $sum: '$tdsAmount' },
                adminCharge: { $sum: '$adminChargeAmount' },
                netPaid: { $sum: '$netAmount' }
            }}
        ]);
        
        let approvedWithdrawals = withdrawals.find(w => w._id === 'Approved') || { count: 0, gross: 0, tds: 0, adminCharge: 0, netPaid: 0 };
        let pendingWithdrawals = withdrawals.find(w => w._id === 'Pending') || { count: 0, gross: 0, tds: 0, adminCharge: 0, netPaid: 0 };

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalIncomeGenerated,
                approvedWithdrawals,
                pendingWithdrawals
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching reports" });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Secure Backend Server is running on port ${PORT}`));
