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

// Dashboard Data Route (Mocked for now)
app.get('/api/dashboard', async (req, res) => {
    const userCount = await User.countDocuments();
    res.json({
        success: true,
        data: {
            totalEarnings: 0, mainWallet: 0, directReferral: 0,
            teamIncome: 0, withdrawFund: 0, autopoolFund: 0, allRanks: 0,
            networkStats: { directReferrals: 0, totalTeamSize: userCount, autopoolStatus: "Level 1" }
        }
    });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Secure Backend Server is running on port ${PORT}`));
