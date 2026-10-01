const mongoose = require('mongoose');
const User = require('./models/User');
const GlobalPool = require('./models/GlobalPool');
const MatrixNode = require('./models/MatrixNode');
const Transaction = require('./models/Transaction');

// Core config
const JOINING_AMOUNT = 1000;
const DIRECT_INCOME = 300;
const LEVEL_INCOME = 10;
const LEVEL_COUNT = 10;

const POOL_FUNDS = {
    GOLD: 40,
    PLATINUM: 60,
    RUBY: 120,
    CROWN_DIAMOND: 180
};

// Helper: Add income with 80% / 20% Rebirth split
async function addIncome(user, amount, type, desc) {
    if (amount <= 0) return;
    
    const mainAmount = amount * 0.8;
    const rebirthAmount = amount * 0.2;

    user.mainWallet += mainAmount;
    user.rebirthWallet += rebirthAmount;
    user.totalEarnings += amount;

    await Transaction.create({
        memberId: user.memberId,
        type: 'Credit',
        category: type,
        remark: desc,
        amount: mainAmount,
        status: 'COMPLETED',
        date: new Date()
    }); // Logging main income

    await user.save();
    await checkAndTriggerRebirth(user);
}

// Trigger Rebirth if wallet hits 1000
async function checkAndTriggerRebirth(user) {
    if (user.rebirthWallet >= 1000) {
        const rebirthsToCreate = Math.floor(user.rebirthWallet / 1000);
        user.rebirthWallet -= (rebirthsToCreate * 1000);
        user.rebirthCount += rebirthsToCreate;
        await user.save();

        for (let i = 0; i < rebirthsToCreate; i++) {
            const rebirthMemberId = `${user.memberId}-R${user.rebirthCount - rebirthsToCreate + i + 1}`;
            const rebirthUser = new User({
                memberId: rebirthMemberId,
                name: `${user.name} (Rebirth)`,
                isRebirth: true,
                mainUserId: user._id,
                role: 'member',
                isActive: true
            });
            await rebirthUser.save();

            // Rebirth only enters Autopool, does not distribute direct/level/rank funds!
            await placeInAutopool(rebirthUser, 1);
        }
    }
}

// Global Autopool logic (4x Matrix)
async function placeInAutopool(user, level = 1) {
    const lastNode = await MatrixNode.findOne({ poolLevel: level }).sort({ nodeIndex: -1 });
    const nextIndex = lastNode ? lastNode.nodeIndex + 1 : 1;

    let parentNode = null;
    if (nextIndex > 1) {
        const parentIndex = Math.ceil((nextIndex - 1) / 4);
        parentNode = await MatrixNode.findOne({ poolLevel: level, nodeIndex: parentIndex });
    }

    const newNode = new MatrixNode({
        userId: user._id,
        memberId: user.memberId,
        poolLevel: level,
        nodeIndex: nextIndex,
        parentId: parentNode ? parentNode._id : null,
        isRebirth: user.isRebirth
    });

    await newNode.save();

    if (parentNode) {
        parentNode.children.push(newNode._id);
        await parentNode.save();

        // Check if parent filled (4 children) -> Handle payout & upgrade
        if (parentNode.children.length === 4) {
            await handleAutopoolPayoutAndUpgrade(parentNode.userId, level);
        }
    }
}

async function handleAutopoolPayoutAndUpgrade(userId, level) {
    const user = await User.findById(userId);
    if (!user) return;

    let payout = 0;
    let nextLevel = level + 1;
    // Payout based on level
    switch(level) {
        case 1: payout = 200; break;
        case 2: payout = 800; break;
        case 3: payout = 1600; break;
        case 4: payout = 3200; break;
        case 5: payout = 6400; nextLevel = 0; break; // 0 means maxed out
    }

    if (payout > 0) {
        await addIncome(user, payout, 'AUTOPOOL', `Autopool Level ${level} completion`);
    }

    if (nextLevel > 0) {
        await placeInAutopool(user, nextLevel);
    }
}

// Main Activation Logic
async function activateUser(user, sponsor) {
    // 1. Direct Income
    if (sponsor && !user.isRebirth) {
        await addIncome(sponsor, DIRECT_INCOME, 'DIRECT', `Direct Referral Bonus from ${user.memberId}`);
        
        sponsor.directReferralsCount += 1;
        sponsor.directs.push(user.memberId);
        
        // Rank upgrades logic
        await updateRankStatus(sponsor);
    }

    // 2. Level Income (10 Levels)
    if (!user.isRebirth) {
        let currentSponsor = sponsor;
        for (let i = 1; i <= LEVEL_COUNT; i++) {
            if (!currentSponsor) break;
            // Add level income (Rs 10)
            await addIncome(currentSponsor, LEVEL_INCOME, 'LEVEL', `Level ${i} Income from ${user.memberId}`);
            
            // Move up
            if (currentSponsor.sponsorId) {
                currentSponsor = await User.findOne({ memberId: currentSponsor.sponsorId });
            } else {
                break;
            }
        }
    }

    // 3. Royalty Pools Distribution (Gold, Platinum, Ruby, Crown)
    if (!user.isRebirth) {
        for (const [pool, amount] of Object.entries(POOL_FUNDS)) {
            let globalPool = await GlobalPool.findOne({ poolName: pool });
            if (!globalPool) {
                globalPool = new GlobalPool({ poolName: pool });
            }
            globalPool.totalFund += amount;
            await globalPool.save();
        }
    }

    // 4. Enter Global Autopool Level 1
    await placeInAutopool(user, 1);
}

// Update Rank Status
async function updateRankStatus(sponsor) {
    // Check Gold (2 directs)
    if (sponsor.directReferralsCount >= 2 && !sponsor.isGold) {
        sponsor.isGold = true;
        let globalPool = await GlobalPool.findOne({ poolName: 'GOLD' });
        if(globalPool) {
            globalPool.activeQueue.push({ memberId: sponsor.memberId, addedAt: new Date() });
            await globalPool.save();
        }
    }
    await sponsor.save();
    // Complex logic for Platinum, Ruby, Crown would check downline stats
}

const MAX_CAPS = {
    GOLD: 60000,
    PLATINUM: 100000,
    RUBY: 200000,
    CROWN_DIAMOND: 400000
};

// Daily Pool Distribution (Cron Job)
async function processDailyPools() {
    for (const pool of ['GOLD', 'PLATINUM', 'RUBY', 'CROWN_DIAMOND']) {
        const globalPool = await GlobalPool.findOne({ poolName: pool });
        if (!globalPool || globalPool.totalFund <= 0) continue;

        const queue = globalPool.activeQueue.slice(0, 10); // FIFO Top 10
        if (queue.length === 0) continue;

        const amountPerUser = globalPool.totalFund / queue.length;
        
        const membersToRemove = [];

        for (const item of queue) {
            const user = await User.findOne({ memberId: item.memberId });
            if (user) {
                // Ensure they don't exceed their cap
                const earningField = pool.toLowerCase() + 'Earnings'; // e.g. 'goldEarnings'
                let amountToGive = amountPerUser;

                if (user[earningField] + amountToGive >= MAX_CAPS[pool]) {
                    amountToGive = MAX_CAPS[pool] - user[earningField];
                    membersToRemove.push(item.memberId);
                }

                if (amountToGive > 0) {
                    user[earningField] += amountToGive;
                    await user.save();
                    await addIncome(user, amountToGive, 'ROYALTY', `${pool} Royalty Bonus`);
                }
            }
        }

        // Remove maxed-out users from the queue
        if (membersToRemove.length > 0) {
            globalPool.activeQueue = globalPool.activeQueue.filter(
                q => !membersToRemove.includes(q.memberId)
            );
        }

        // Reset the pool fund after distribution
        globalPool.totalFund = 0;
        await globalPool.save();
    }
}

module.exports = {
    activateUser,
    addIncome,
    processDailyPools
};
