require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mlm_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper function to update wallet and handle rebirth deduction
async function distributeIncome(connection, userId, amount, type, description) {
    // 20% deduction for rebirth wallet
    const rebirthDeduction = amount * 0.20;
    const finalAmount = amount - rebirthDeduction;

    // Update Wallets
    await connection.query(
        `UPDATE wallets SET main_balance = main_balance + ?, rebirth_balance = rebirth_balance + ?, total_earned = total_earned + ? WHERE user_id = ?`,
        [finalAmount, rebirthDeduction, amount, userId]
    );

    // Record Transaction
    await connection.query(
        `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)`,
        [userId, finalAmount, type, description]
    );

    // Record Rebirth Deduction
    await connection.query(
        `INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)`,
        [userId, rebirthDeduction, 'rebirth_deduction', `Rebirth deduction for ${description}`]
    );

    // Check if Rebirth Wallet hit 1000 to create new Rebirth ID (Logic handled separately or via trigger)
}

// ----------------------------------------------------
// API: ACCOUNT ACTIVATION & FUND DISTRIBUTION
// ----------------------------------------------------
app.post('/api/activate', async (req, res) => {
    const { user_id } = req.body; 
    const ACTIVATION_FEE = 5000;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get user and sponsor info
        const [users] = await connection.query(`SELECT sponsor_id, is_active FROM users WHERE id = ?`, [user_id]);
        if (users.length === 0) throw new Error("User not found");
        if (users[0].is_active) throw new Error("User is already active");

        const sponsor_id = users[0].sponsor_id;

        // 2. Mark user as active
        await connection.query(`UPDATE users SET is_active = TRUE, rank = 'active' WHERE id = ?`, [user_id]);

        // 3. Direct Referral Income (30% = 1500)
        if (sponsor_id) {
            await distributeIncome(connection, sponsor_id, 1500, 'direct_income', `Direct referral bonus for User ${user_id}`);
        }

        // 4. Team Income (10% = 500 over 10 levels => 50 per level)
        let currentSponsor = sponsor_id;
        for (let i = 1; i <= 10; i++) {
            if (!currentSponsor) break; // Reached top of the tree

            await distributeIncome(connection, currentSponsor, 50, 'team_income', `Level ${i} team income from User ${user_id}`);
            
            // Move up one level
            const [uplines] = await connection.query(`SELECT sponsor_id FROM users WHERE id = ?`, [currentSponsor]);
            if (uplines.length > 0) {
                currentSponsor = uplines[0].sponsor_id;
            } else {
                break;
            }
        }

        // 5. Add User to Global Autopool (20% = 1000 collected for pool)
        await connection.query(`INSERT INTO autopool (user_id, pool_level) VALUES (?, 1)`, [user_id]);

        // (Gold, Platinum, Ruby, Crown Diamond logic can be added here or calculated via a cron job daily)

        await connection.commit();
        res.json({ status: 'success', message: 'Account activated successfully and funds distributed!' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
});

// ----------------------------------------------------
// API: DASHBOARD DATA (Fetch Wallet & Earnings)
// ----------------------------------------------------
app.get('/api/dashboard/:userId', async (req, res) => {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    try {
        const [wallets] = await connection.query(`SELECT main_balance, rebirth_balance, total_earned FROM wallets WHERE user_id = ?`, [userId]);
        const [users] = await connection.query(`SELECT name, member_id, rank, is_active FROM users WHERE id = ?`, [userId]);
        const [autopool] = await connection.query(`SELECT pool_level FROM autopool WHERE user_id = ?`, [userId]);

        if (wallets.length === 0 || users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({
            status: 'success',
            data: {
                user: users[0],
                wallet: wallets[0],
                autopool: autopool.length > 0 ? autopool[0] : null
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
