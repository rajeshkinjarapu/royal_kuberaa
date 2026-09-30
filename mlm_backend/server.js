require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// JSON File Database Setup (Requires NO installation, works 100% on VPS)
const DB_FILE = path.join(__dirname, 'database.json');

const initDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [
                {
                    memberId: "ADMIN",
                    password: "Admin@123",
                    name: "Super Admin",
                    role: "admin",
                    rank: "OWNER",
                    walletBalance: 0,
                    joinDate: new Date().toISOString()
                }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
};
initDB();

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Basic Route
app.get('/', (req, res) => res.json({ message: "Royal Kuberaa API Running" }));

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { memberId, password } = req.body;
    const db = readDB();
    
    const user = db.users.find(u => u.memberId === memberId.toUpperCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid User ID! Account does not exist.' });
    if (user.password !== password) return res.status(401).json({ success: false, message: 'Incorrect Password!' });

    const token = jwt.sign({ memberId: user.memberId, role: user.role }, 'royal_kuberaa_secret', { expiresIn: '1d' });

    res.json({
        success: true,
        token,
        user: { name: user.name, memberId: user.memberId, role: user.role, rank: user.rank, walletBalance: user.walletBalance }
    });
});

// --- Register Member Route (Saves to DB) ---
app.post('/api/register', (req, res) => {
    const { memberId, password, name } = req.body;
    const db = readDB();

    // Check if user already exists
    if (db.users.find(u => u.memberId === memberId.toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Member ID already exists! Choose another.' });
    }

    const newUser = {
        memberId: memberId.toUpperCase(),
        password: password,
        name: name,
        role: "member",
        rank: "STARTER",
        walletBalance: 0,
        joinDate: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    res.json({ success: true, message: 'Member Registered Successfully!', user: newUser });
});

// Dashboard Data Route
app.get('/api/dashboard', (req, res) => {
    const db = readDB();
    res.json({
        success: true,
        data: {
            totalEarnings: 18500, mainWallet: 12500, directReferral: 4500,
            teamIncome: 2500, withdrawFund: 600, autopoolFund: 8000, allRanks: 0,
            networkStats: { directReferrals: 3, totalTeamSize: db.users.length, autopoolStatus: "Level 1" }
        }
    });
});

// Admin Users List Route
app.get('/api/admin/users', (req, res) => {
    const db = readDB();
    res.json({ success: true, data: db.users.map(u => ({ id: u.memberId, name: u.name, wallet: u.walletBalance, status: "Active" })) });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend Server is running on port ${PORT}`));
