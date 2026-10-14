const mongoose = require('mongoose');
const User = require('./models/User');
const GlobalPool = require('./models/GlobalPool');
const Transaction = require('./models/Transaction');

// Core config
const DIRECT_INCOME = 400;
const LEVEL_INCOMES = {
    1: 100, 2: 50, 3: 40, 4: 30, 5: 20, 6: 15, 7: 15, 8: 10, 9: 10, 10: 10
};

const NORMAL_POOLS = { GOLD: 120, PLATINUM: 60, RUBY: 60, DIAMOND: 60 };
const REBIRTH_POOLS = { GOLD: 440, PLATINUM: 220, RUBY: 220, DIAMOND: 220 };
const NON_WORKING_FUND_AMOUNT = 150; // ₹100 base + ₹50 from Company Profit
const FIFO_AUTOPOOL_CAP = 1500;

// Caps
const MAX_CAPS = {
    GOLD: 20000,
    PLATINUM: 100000,
    RUBY: 500000,
    DIAMOND: 2500000
};

// Helper: Add income with 90% / 10% Rebirth split
async function addIncome(user, amount, type, desc) {
    if (amount <= 0) return;
    
    const mainAmount = amount * 0.9;
    const rebirthAmount = amount * 0.1;

    user.mainWallet += mainAmount;
    user.rebirthWallet += rebirthAmount;
    user.totalEarnings += amount;

    await Transaction.create({
        userId: user._id,
        memberId: user.memberId,
        type: 'Credit',
        category: type,
        remark: desc,
        amount: mainAmount,
        status: 'COMPLETED',
        date: new Date()
    });

    await user.save();
    await checkAndTriggerRebirth(user);
}

// Trigger Rebirth (100% Distribution: ₹400 Sponsor Bonus, ₹1100 Royalty Pools)
async function checkAndTriggerRebirth(user) {
    if (user.rebirthWallet >= 1500) {
        const rebirthsToCreate = Math.floor(user.rebirthWallet / 1500);
        user.rebirthWallet -= (rebirthsToCreate * 1500);
        user.rebirthCount += rebirthsToCreate;
        await user.save();

        for (let i = 0; i < rebirthsToCreate; i++) {
            const rebirthMemberId = `${user.memberId}-R${user.rebirthCount - rebirthsToCreate + i + 1}`;
            const rebirthUser = new User({
                memberId: rebirthMemberId,
                name: `${user.name} (Rebirth)`,
                isRebirth: true,
                mainUserId: user._id,
                sponsorId: user.sponsorId,
                role: 'member',
                isActive: true
            });
            await rebirthUser.save();

            // Record Debit Transaction in User's Passbook
            await Transaction.create({
                userId: user._id,
                memberId: user.memberId,
                type: 'Debit',
                category: 'REBIRTH_GENERATED',
                remark: `₹1,500 deducted from Rebirth Wallet for generating Rebirth ID: ${rebirthMemberId}`,
                amount: 1500,
                status: 'COMPLETED',
                date: new Date()
            });

            // Rebirth distribution: ₹400 to Sponsor (or Company Admin fallback)
            let sponsor = null;
            if (user.sponsorId) {
                sponsor = await User.findOne({ memberId: user.sponsorId });
            }
            if (sponsor) {
                await addIncome(sponsor, 400, 'DIRECT', `Rebirth Sponsor Bonus from ${rebirthMemberId}`);
            } else {
                const admin = await User.findOne({ role: 'admin' });
                if (admin) {
                    await addIncome(admin, 400, 'DIRECT', `Company Rebirth Bonus from ${rebirthMemberId}`);
                }
            }

            // ₹1100 to Daily Royalty Pools (Gold-440, Platinum-220, Ruby-220, Diamond-220)
            for (const [pool, amount] of Object.entries(REBIRTH_POOLS)) {
                await GlobalPool.findOneAndUpdate(
                    { poolName: pool },
                    { $inc: { totalFund: amount } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
        }
    }
}



// FIFO Autopool Distribution Logic (₹150 split equally among the active Top 10 members until ₹1500 capping)
async function distributeFifoAutopool(newMember) {
    const TOTAL_POOL_AMOUNT = NON_WORKING_FUND_AMOUNT; // ₹150
    const CAPPING = FIFO_AUTOPOOL_CAP; // ₹1500

    // Record cumulative pool contribution in GlobalPool for admin analytics
    await GlobalPool.findOneAndUpdate(
        { poolName: 'NON_WORKING' },
        { $inc: { totalFund: TOTAL_POOL_AMOUNT } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Find top 10 active, uncompleted members in strict FIFO order
    // Exclude current new member, admin, and rebirth virtual IDs
    const activeQueue = await User.find({
        isActive: true,
        role: { $ne: 'admin' },
        isRebirth: { $ne: true },
        isAutopoolCompleted: { $ne: true },
        _id: { $ne: newMember._id }
    }).sort({ activatedAt: 1, createdAt: 1 }).limit(10);

    if (!activeQueue || activeQueue.length === 0) {
        console.log(`[FIFO Autopool] No eligible members in queue yet. Fund ₹${TOTAL_POOL_AMOUNT} recorded in GlobalPool.`);
        return;
    }

    const memberCount = activeQueue.length;
    const sharePerSlot = Math.floor((TOTAL_POOL_AMOUNT / memberCount) * 100) / 100;

    for (const member of activeQueue) {
        const currentEarnings = member.autopoolEarnings || 0;
        const maxAllowed = Math.max(0, CAPPING - currentEarnings);
        const amountToGive = Math.min(sharePerSlot, maxAllowed);

        if (amountToGive > 0) {
            member.autopoolEarnings = Math.round((currentEarnings + amountToGive) * 100) / 100;
            if (member.autopoolEarnings >= CAPPING) {
                member.isAutopoolCompleted = true;
                console.log(`[FIFO Autopool] Member ${member.memberId} reached ₹${CAPPING} capping! Graduated from queue.`);
            }
            await member.save();

            await addIncome(
                member,
                amountToGive,
                'AUTOPOOL',
                `FIFO Autopool Share from ${newMember.memberId} (Progress: ₹${member.autopoolEarnings.toFixed(2)}/${CAPPING})`
            );
        }
    }
}

// Main Activation Logic
async function activateUser(user, sponsor) {
    // Ensure activatedAt is stamped for FIFO order
    if (!user.activatedAt) {
        user.activatedAt = new Date();
        await user.save();
    }

    // 1. Direct Income (400)
    if (sponsor) {
        await addIncome(sponsor, DIRECT_INCOME, 'DIRECT', `Direct Referral Bonus from ${user.memberId}`);
        sponsor.directReferralsCount += 1;
        sponsor.directs.push(user.memberId);
        await updateRankStatus(sponsor);
        await sponsor.save();
    }

    // 2. Team Level Income (10 Levels Traverse up Sponsor Tree)
    let currentNode = user;
    let currentLevel = 1;
    let totalLevelDistributed = 0;
    
    while (currentNode && currentNode.sponsorId && currentLevel <= 10) {
        let upline = await User.findOne({ memberId: currentNode.sponsorId });
        if (!upline) break;

        // Add Team Count
        upline.totalTeamCount += 1;

        // Add Level Income
        const levelAmount = LEVEL_INCOMES[currentLevel];
        if (levelAmount && upline.isActive) {
            await addIncome(upline, levelAmount, 'LEVEL', `Level ${currentLevel} Team Income from ${user.memberId}`);
            totalLevelDistributed += levelAmount;
        }

        await upline.save();
        currentNode = upline;
        currentLevel++;
    }

    // 2.5 Admin Roll-up for undistributed level income
    const TOTAL_LEVEL_INCOME = 300;
    if (totalLevelDistributed < TOTAL_LEVEL_INCOME) {
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            const leftover = TOTAL_LEVEL_INCOME - totalLevelDistributed;
            await addIncome(admin, leftover, 'LEVEL', `Level Income Roll-up from ${user.memberId}`);
        }
    }

    // 4. Daily Royalty Pools Fund Contribution (₹300)
    for (const [pool, amount] of Object.entries(NORMAL_POOLS)) {
        await GlobalPool.findOneAndUpdate(
            { poolName: pool },
            { $inc: { totalFund: amount } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    // 5. Global FIFO Autopool Instant Distribution (₹150: ₹100 base + ₹50 from Company Profit)
    await distributeFifoAutopool(user);

    // 6. Remaining ₹350 = ₹250 Product Cost + ₹100 Company Net Profit per ₹1500 Joining
}

// Helper: Add user to Global Pool with duplicate check
async function joinPool(memberId, poolName) {
    let globalPool = await GlobalPool.findOne({ poolName });
    if (!globalPool) globalPool = new GlobalPool({ poolName });
    if (!globalPool.activeQueue) globalPool.activeQueue = [];
    
    const alreadyInQueue = globalPool.activeQueue.some(item => item.memberId === memberId);
    if (!alreadyInQueue) {
        globalPool.activeQueue.push({ memberId, addedAt: new Date() });
        await globalPool.save();
    }
}

// Check and Update Rank (Gold, Platinum, Ruby, Diamond) recursively up the sponsor tree
async function updateRankStatus(sponsor) {
    let currentSponsor = sponsor;
    while (currentSponsor) {
        let promoted = false;

        // ONLY count activated members (who paid ₹1000) for rank advancement
        const directs = await User.find({ sponsorId: currentSponsor.memberId, isActive: true });
        
        // GOLD (ANY 2 Active Directs)
        if (directs.length >= 2 && !currentSponsor.isGold) {
            currentSponsor.isGold = true;
            currentSponsor.rank = 'GOLD';
            await joinPool(currentSponsor.memberId, 'GOLD');
            promoted = true;
        }

        // PLATINUM (2 Gold Active Directs)
        const goldDirects = directs.filter(d => d.isGold);
        if (goldDirects.length >= 2 && !currentSponsor.isPlatinum) {
            currentSponsor.isPlatinum = true;
            currentSponsor.rank = 'PLATINUM';
            await joinPool(currentSponsor.memberId, 'PLATINUM');
            promoted = true;
        }

        // RUBY (5 Platinum Active Directs)
        const platinumDirects = directs.filter(d => d.isPlatinum);
        if (platinumDirects.length >= 5 && !currentSponsor.isRuby) {
            currentSponsor.isRuby = true;
            currentSponsor.rank = 'RUBY';
            await joinPool(currentSponsor.memberId, 'RUBY');
            promoted = true;
        }

        // DIAMOND (5 Ruby Active Directs)
        const rubyDirects = directs.filter(d => d.isRuby);
        if (rubyDirects.length >= 5 && !currentSponsor.isDiamond) {
            currentSponsor.isDiamond = true;
            currentSponsor.rank = 'DIAMOND';
            await joinPool(currentSponsor.memberId, 'DIAMOND');
            promoted = true;
        }

        await currentSponsor.save();

        // If promoted, recursively check their sponsor (since this promotion might unlock their sponsor's next rank)
        if (promoted && currentSponsor.sponsorId) {
            currentSponsor = await User.findOne({ memberId: currentSponsor.sponsorId });
        } else {
            break;
        }
    }
}

// Cron Job function: Distributes the funds at 12:00 AM
async function processDailyPools() {
    // 1. Royalty Pools Distribution
    for (const pool of ['GOLD', 'PLATINUM', 'RUBY', 'DIAMOND']) {
        const globalPool = await GlobalPool.findOne({ poolName: pool });
        if (!globalPool || globalPool.totalFund <= 0) continue;

        const queue = globalPool.activeQueue;
        if (queue.length === 0) continue;

        const amountPerUser = globalPool.totalFund / queue.length;
        const membersToRemove = [];

        for (const item of queue) {
            const user = await User.findOne({ memberId: item.memberId });
            if (user) {
                const earningField = pool.toLowerCase() + 'Earnings';
                let amountToGive = amountPerUser;

                if (user[earningField] + amountToGive >= MAX_CAPS[pool]) {
                    amountToGive = MAX_CAPS[pool] - user[earningField];
                    membersToRemove.push(item.memberId);
                }

                if (amountToGive > 0) {
                    user[earningField] += amountToGive;
                    await user.save();
                    await addIncome(user, amountToGive, 'ROYALTY', `${pool} Daily Royalty Share`);
                }
            }
        }
        
        if (membersToRemove.length > 0) {
            globalPool.activeQueue = globalPool.activeQueue.filter(q => !membersToRemove.includes(q.memberId));
        }
        globalPool.totalFund = 0;
        await globalPool.save();
    }

    // 2. Global Non-Working / FIFO Autopool Pool Monitoring
    // Note: FIFO Autopool (₹150) is distributed instantly on every user activation to the active Top 10 members.
    const nwPool = await GlobalPool.findOne({ poolName: 'NON_WORKING' });
    if (nwPool) {
        console.log(`[Daily Cron] FIFO Autopool cumulative activity pool status: Total Fund logged = ₹${nwPool.totalFund}`);
    }
}

module.exports = { activateUser, addIncome, processDailyPools, distributeFifoAutopool };
