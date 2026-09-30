require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Fake Database (Strict Authentication)
const USERS_DB = [
    {
        _id: "1",
        memberId: "ADMIN",
        password: "Admin@123", // strict password
        name: "Super Admin",
        role: "admin",
        rank: "OWNER",
        walletBalance: 0
    },
    {
        _id: "2",
        memberId: "RK1001",
        password: "User@123", // strict password
        name: "Rajesh Kumar",
        role: "member",
        rank: "GOLD RANK",
        walletBalance: 15000
    }
];

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to Royal Kuberaa API" });
});

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { memberId, password } = req.body;
    
    // Check if user exists in our DB
    const user = USERS_DB.find(u => u.memberId === memberId.toUpperCase());
    
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid User ID! Account does not exist.' });
    }

    // Check Password strictly
    if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Incorrect Password!' });
    }

    // Generate Token
    const token = jwt.sign({ id: user._id, role: user.role }, 'royal_kuberaa_secret', { expiresIn: '1d' });

    res.json({
        success: true,
        token,
        user: {
            name: user.name,
            memberId: user.memberId,
            role: user.role,
            rank: user.rank,
            walletBalance: user.walletBalance
        }
    });
});

// Dashboard Data Route (Dummy for now)
app.get('/api/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalEarnings: 18500, mainWallet: 12500, directReferral: 4500,
            teamIncome: 2500, withdrawFund: 600, autopoolFund: 8000, allRanks: 0,
            networkStats: { directReferrals: 3, totalTeamSize: 124, autopoolStatus: "Level 1" }
        }
    });
});

// Wallets Route (Dummy for now)
app.get('/api/wallets', (req, res) => {
    res.json({
        success: true,
        data: {
            balance: 12500,
            transactions: [
                { id: "TXN1021", date: "2026-09-30", amount: 500, type: "Credit", remark: "Daily ROI" },
                { id: "TXN1022", date: "2026-09-29", amount: 1200, type: "Credit", remark: "Direct Referral" },
                { id: "TXN1023", date: "2026-09-28", amount: -200, type: "Debit", remark: "P2P Transfer" }
            ]
        }
    });
});

// Network Route (Dummy for now)
app.get('/api/network', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: "RK1001", name: "Ramesh", joinDate: "2026-09-15", status: "Active", package: "₹10,000" },
            { id: "RK1002", name: "Suresh", joinDate: "2026-09-18", status: "Inactive", package: "₹0" },
            { id: "RK1003", name: "Mahesh", joinDate: "2026-09-22", status: "Active", package: "₹25,000" }
        ]
    });
});

// Admin Routes (Dummy for now)
app.get('/api/admin/users', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: "RK1001", name: "Ramesh", email: "ramesh@test.com", wallet: 15000, status: "Active" },
            { id: "RK1002", name: "Suresh", email: "suresh@test.com", wallet: 200, status: "Blocked" },
            { id: "RK1003", name: "Mahesh", email: "mahesh@test.com", wallet: 35000, status: "Active" }
        ]
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend Server is running on port ${PORT}`);
});
