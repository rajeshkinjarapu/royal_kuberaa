const mongoose = require('mongoose');
const User = require('./models/User');
const GlobalPool = require('./models/GlobalPool');
const Transaction = require('./models/Transaction');

// Core config
const DIRECT_INCOME = 400;
const BINARY_INCOME = 300;
const MAX_DAILY_PAIRS = 5;

const NORMAL_POOLS = { GOLD: 120, PLATINUM: 60, RUBY: 60, DIAMOND: 60 };
const REBIRTH_POOLS = { GOLD: 440, PLATINUM: 220, RUBY: 220, DIAMOND: 220 };
const NON_WORKING_FUND_AMOUNT = 100;

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
                let globalPool = await GlobalPool.findOne({ poolName: pool });
                if (!globalPool) globalPool = new GlobalPool({ poolName: pool });
                globalPool.totalFund += amount;
                await globalPool.save();
            }
        }
    }
}

// Main Activation Logic
async function activateUser(user, sponsor, placement) {
    // 1. Binary Placement (Extreme Left or Right Spillover)
    if (sponsor) {
        let currentUpline = sponsor;
        while (true) {
            let nextUplineId = placement === 'Left' ? currentUpline.leftUpline : currentUpline.rightUpline;
            if (!nextUplineId) {
                user.uplineId = currentUpline.memberId;
                user.placement = placement;
                
                if (placement === 'Left') {
                    currentUpline.leftUpline = user.memberId;
                } else {
                    currentUpline.rightUpline = user.memberId;
                }
                
                await currentUpline.save();
                await user.save();
                break;
            }
            currentUpline = await User.findOne({ memberId: nextUplineId });
        }
    }

    // 2. Direct Income (400)
    if (sponsor) {
        await addIncome(sponsor, DIRECT_INCOME, 'DIRECT', `Direct Referral Bonus from ${user.memberId}`);
        sponsor.directReferralsCount += 1;
        sponsor.directs.push(user.memberId);
        await updateRankStatus(sponsor);
    }

    // 3. Binary Matching Income (Traverse up Binary Tree)
    let currentNode = user;
    let childMemberId = user.memberId;
    while (currentNode && currentNode.uplineId) {
        let upline = await User.findOne({ memberId: currentNode.uplineId });
        if (!upline) break;

        // Accurately determine if child arrived via left or right subtree
        const isLeft = (upline.leftUpline === childMemberId);
        if (isLeft) {
            upline.leftTeamCount += 1;
            upline.leftCarryForward += 1;
        } else {
            upline.rightTeamCount += 1;
            upline.rightCarryForward += 1;
        }

        // Qualification Check: User must have at least 1 Active Direct on Left and 1 Active Direct on Right to earn binary income
        const activeDirects = await User.find({ sponsorId: upline.memberId, isActive: true });
        const hasLeftDirect = activeDirects.some(d => d.placement === 'Left');
        const hasRightDirect = activeDirects.some(d => d.placement === 'Right');
        const isBinaryQualified = hasLeftDirect && hasRightDirect;

        let matched = false;
        if (isBinaryQualified) {
            // First Pair Condition: 1:2 or 2:1
            if (!upline.hasCompletedFirstPair) {
                if (upline.leftCarryForward >= 2 && upline.rightCarryForward >= 1) {
                    upline.leftCarryForward -= 2;
                    upline.rightCarryForward -= 1;
                    matched = true;
                } else if (upline.leftCarryForward >= 1 && upline.rightCarryForward >= 2) {
                    upline.leftCarryForward -= 1;
                    upline.rightCarryForward -= 2;
                    matched = true;
                }
                if (matched) upline.hasCompletedFirstPair = true;
            } else {
                // Subsequent Pairs: 1:1
                if (upline.leftCarryForward >= 1 && upline.rightCarryForward >= 1) {
                    upline.leftCarryForward -= 1;
                    upline.rightCarryForward -= 1;
                    matched = true;
                }
            }

            if (matched) {
                upline.totalPairsMatched += 1;
                
                if (upline.todayPairsCount < MAX_DAILY_PAIRS) {
                    upline.todayPairsCount += 1;
                    await addIncome(upline, BINARY_INCOME, 'BINARY', `Binary Matching Bonus (Pair #${upline.totalPairsMatched})`);
                } else {
                    // FLUSH OUT logic: Capping reached (5 pairs/day). Extra matched business is permanently flushed out.
                    upline.todayPairsFlushedCount += 1;
                    console.log(`Flush out recorded for user: ${upline.memberId}, today extra pair: ${upline.todayPairsFlushedCount}`);
                }
            }
        }

        await upline.save();
        childMemberId = upline.memberId;
        currentNode = upline;
    }

    // 4. Daily Royalty Pools Fund Contribution (₹300)
    for (const [pool, amount] of Object.entries(NORMAL_POOLS)) {
        let globalPool = await GlobalPool.findOne({ poolName: pool });
        if (!globalPool) globalPool = new GlobalPool({ poolName: pool });
        globalPool.totalFund += amount;
        await globalPool.save();
    }

    // 5. Global Non-Working Cashback Fund (₹100)
    let nwPool = await GlobalPool.findOne({ poolName: 'NON_WORKING' });
    if (!nwPool) nwPool = new GlobalPool({ poolName: 'NON_WORKING' });
    nwPool.totalFund += NON_WORKING_FUND_AMOUNT;
    await nwPool.save();

    // 6. Remaining ₹400 = ₹250 Product Cost + ₹150 Company Net Profit per ₹1500 Joining
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

    // 2. Global Non-Working Cashback Distribution
    const nwPool = await GlobalPool.findOne({ poolName: 'NON_WORKING' });
    if (nwPool && nwPool.totalFund > 0) {
        // Business Plan Rule: Equal distribution ONLY among active non-working members (0 Directs & 0 Binary Pairs)
        // until ₹1500 joining fee is recovered. If a user makes even 1 direct referral, they stop receiving cashback permanently!
        const eligibleCashbackUsers = await User.find({ 
            directReferralsCount: 0,
            totalPairsMatched: 0,
            cashbackEarnings: { $lt: 1500 },
            isActive: true, 
            isRebirth: false 
        });

        if (eligibleCashbackUsers.length > 0) {
            const rawShare = Math.floor((nwPool.totalFund / eligibleCashbackUsers.length) * 100) / 100;
            let totalDistributed = 0;

            for (const user of eligibleCashbackUsers) {
                // Double check they haven't sponsored anyone
                if (user.directReferralsCount > 0 || (user.directs && user.directs.length > 0)) {
                    continue;
                }

                const currentEarnings = user.cashbackEarnings || 0;
                const maxAllowed = 1500 - currentEarnings;
                const amountToGive = Math.min(rawShare, maxAllowed);
                
                if (amountToGive > 0) {
                    user.cashbackEarnings = currentEarnings + amountToGive;
                    await user.save();
                    await addIncome(user, amountToGive, 'CASHBACK', `Daily Non-Working Cashback (Recovered: ₹${user.cashbackEarnings}/1500)`);
                    totalDistributed += amountToGive;
                }
            }
            
            // Retain any leftover funds in the pool (e.g., from users capped at ₹1500) for tomorrow's distribution
            nwPool.totalFund = Math.max(0, nwPool.totalFund - totalDistributed);
            await nwPool.save();
        }
    }

    // 3. Reset Binary Daily Capping & Flushed Counts
    await User.updateMany({}, { todayPairsCount: 0, todayPairsFlushedCount: 0 });
}

module.exports = { activateUser, addIncome, processDailyPools };
