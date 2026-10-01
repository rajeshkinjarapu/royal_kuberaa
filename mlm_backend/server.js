require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

        res.json({
            success: true,
            token,
            user: { 
                name: user.name, 
                memberId: user.memberId, 
                role: user.role, 
                rank: user.rank, 
                walletBalance: user.walletBalance, 
                sponsorId: user.sponsorId 
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during login" });
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

// --- Register Member Route (Secure) ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, mobile, sponsorId, password } = req.body;

        // Check if mobile already exists
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ success: false, message: 'Mobile number already registered!' });
        }

        // Validate Sponsor
        if (sponsorId.toUpperCase() !== 'ADMIN') {
            const sponsor = await User.findOne({ memberId: sponsorId.toUpperCase() });
            if (!sponsor) {
                return res.status(400).json({ success: false, message: 'Invalid Sponsor ID!' });
            }
        }

        // Generate Unique Member ID (RK + 5 random digits)
        let newMemberId;
        let isUnique = false;
        while (!isUnique) {
            newMemberId = 'RK' + Math.floor(10000 + Math.random() * 90000);
            const exists = await User.findOne({ memberId: newMemberId });
            if (!exists) isUnique = true;
        }

        // Hash Password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            memberId: newMemberId,
            password: hashedPassword,
            name,
            mobile,
            sponsorId: sponsorId.toUpperCase(),
            role: "member",
            rank: "STARTER",
            walletBalance: 0
        });

        res.json({ 
            success: true, 
            message: 'Member Registered Successfully!', 
            user: { memberId: newUser.memberId, name: newUser.name } 
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
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
        // NOTE: In the future, we will calculate real earnings from the Transaction model
        // For now, returning real wallet balance and basic network stats.

        res.json({
            success: true,
            data: {
                totalEarnings: user.walletBalance, // Placeholder for total earnings
                mainWallet: user.walletBalance,
                directReferral: 0,
                teamIncome: 0, 
                withdrawFund: 0, 
                autopoolFund: 0, 
                allRanks: 0,
                networkStats: { 
                    directReferrals: totalTeamSize, 
                    totalTeamSize: totalTeamSize, // Simplified for now
                    autopoolStatus: user.rank 
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
            data: users.map(u => ({ id: u.memberId, name: u.name, wallet: u.walletBalance, status: u.isActive ? "Active" : "Blocked" })) 
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

        if (sender.walletBalance < transferAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        const receiver = await User.findOne({ memberId: receiverId.toUpperCase() }).session(session);
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'Receiver ID not found.' });
        }

        // Deduct from Sender
        sender.walletBalance -= transferAmount;
        await sender.save({ session });

        // Add to Receiver
        receiver.walletBalance += transferAmount;
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

        res.json({ success: true, message: 'P2P Transfer Successful!', newBalance: sender.walletBalance });
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

        if (!withdrawAmount || withdrawAmount < 500) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹500.' });
        }

        const user = await User.findById(req.user.id);
        if (user.walletBalance < withdrawAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        // Calculate Deductions
        const tdsAmount = withdrawAmount * 0.05;
        const adminChargeAmount = withdrawAmount * 0.05;
        const netAmount = withdrawAmount - tdsAmount - adminChargeAmount;

        // Deduct from User Wallet
        user.walletBalance -= withdrawAmount;
        await user.save();

        // Record Withdrawal Request
        await Withdrawal.create({
            userId: user._id,
            memberId: user.memberId,
            grossAmount: withdrawAmount,
            tdsAmount,
            adminChargeAmount,
            netAmount,
            status: 'Pending'
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

        res.json({ success: true, message: 'Withdrawal Request Submitted Successfully!', newBalance: user.walletBalance });
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
            data: users.map(u => ({ id: u.memberId, name: u.name, wallet: u.walletBalance, status: u.isActive ? "Active" : "Blocked" })) 
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
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
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
                user.walletBalance += request.grossAmount;
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Secure Backend Server is running on port ${PORT}`));
