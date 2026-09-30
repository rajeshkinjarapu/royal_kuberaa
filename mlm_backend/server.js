require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to Royal Kuberaa API" });
});

// Auth Route
app.post('/api/login', (req, res) => {
    const { memberId, password } = req.body;
    
    // Simple validation for now
    if (memberId && password) {
        res.json({
            success: true,
            token: "sample-jwt-token-12345",
            user: { 
                name: "Rajesh Kumar", 
                memberId: memberId, 
                rank: "GOLD RANK" 
            }
        });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Dashboard Data Route
app.get('/api/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalEarnings: 18500,
            mainWallet: 12500,
            directReferral: 4500,
            teamIncome: 2500,
            withdrawFund: 600,
            autopoolFund: 8000,
            allRanks: 0,
            networkStats: {
                directReferrals: 3,
                totalTeamSize: 124,
                autopoolStatus: "Level 1"
            }
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend Server is running on port ${PORT}`);
});
