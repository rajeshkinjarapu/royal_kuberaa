-- SQL Script for MLM Database Structure

CREATE DATABASE IF NOT EXISTS mlm_db;
USE mlm_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_id INT NULL,
    member_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., RK123456
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    rank ENUM('free', 'active', 'gold', 'platinum', 'ruby', 'crown_diamond') DEFAULT 'free',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Wallets Table (Main and Rebirth)
CREATE TABLE IF NOT EXISTS wallets (
    user_id INT PRIMARY KEY,
    main_balance DECIMAL(10,2) DEFAULT 0.00,
    rebirth_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions Table (To track all earnings and deductions)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('direct_income', 'team_income', 'autopool_income', 'rank_bonus', 'withdrawal', 'deposit', 'rebirth_deduction') NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Autopool Table
CREATE TABLE IF NOT EXISTS autopool (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pool_level INT DEFAULT 1,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Default Admin
INSERT IGNORE INTO users (id, member_id, name, email, password_hash, role, rank, is_active) 
VALUES (1, 'ADMIN1', 'Admin', 'admin@royalkubera.com', 'hash_here', 'admin', 'crown_diamond', TRUE);

INSERT IGNORE INTO wallets (user_id, main_balance) VALUES (1, 0.00);
