const mongoose = require('mongoose');
const User = require('./models/User');
const GlobalPool = require('./models/GlobalPool');
const Transaction = require('./models/Transaction');

// Core config
const DIRECT_INCOME = 250;
const LEVEL_INCOMES = [60, 40, 30, 20, 10, 8, 8, 8, 8, 8];
const BINARY_INCOME = 200;
const MAX_DAILY_PAIRS = 5;

const NORMAL_POOLS = { GOLD: 100, PLATINUM: 50, RUBY: 50, DIAMOND: 50 };
const REBIRTH_POOLS = { GOLD: 300, PLATINUM: 200, RUBY: 100, DIAMOND: 100 };
const NON_WORKING_FUND_AMOUNT = 100;

// Caps
const MAX_CAPS = {
    GOLD: 20000,
    PLATINUM: 100000,
    RUBY: 500000,
    DIAMOND: 2500000
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
    });

    await user.save();
    await checkAndTriggerRebirth(user);
}

// Trigger Rebirth
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
                sponsorId: user.sponsorId,
                role: 'member',
                isActive: true
            });
            await rebirthUser.save();

            // Rebirth distribution: 300 Direct, 700 Royalty Pools
            const sponsor = await User.findOne({ memberId: user.sponsorId });
            if (sponsor) {
                await addIncome(sponsor, 300, 'DIRECT', `Rebirth Sponsor Bonus from ${rebirthMemberId}`);
            }

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

    // 2. Direct Income (250)
    if (sponsor) {
        await addIncome(sponsor, DIRECT_INCOME, 'DIRECT', `Direct Referral Bonus from ${user.memberId}`);
        sponsor.directReferralsCount += 1;
        sponsor.directs.push(user.memberId);
        await updateRankStatus(sponsor);
    }

    // 3. Level Income (10 Levels in Sponsor Tree)
    let currentSponsor = sponsor;
    for (let i = 0; i < LEVEL_INCOMES.length; i++) {
        if (!currentSponsor) break;
        await addIncome(currentSponsor, LEVEL_INCOMES[i], 'LEVEL', `Level ${i+1} Income from ${user.memberId}`);
        if (currentSponsor.sponsorId) {
            currentSponsor = await User.findOne({ memberId: currentSponsor.sponsorId });
        } else {
            break;
        }
    }

    // 4. Binary Matching Income (Traverse up Binary Tree)
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

    // 5. Daily Royalty Pools Fund Contribution
    for (const [pool, amount] of Object.entries(NORMAL_POOLS)) {
        let globalPool = await GlobalPool.findOne({ poolName: pool });
        if (!globalPool) globalPool = new GlobalPool({ poolName: pool });
        globalPool.totalFund += amount;
        await globalPool.save();
    }

    // 6. Global Non-Working Cashback Fund
    let nwPool = await GlobalPool.findOne({ poolName: 'NON_WORKING' });
    if (!nwPool) nwPool = new GlobalPool({ poolName: 'NON_WORKING' });
    nwPool.totalFund += NON_WORKING_FUND_AMOUNT;
    await nwPool.save();
}

// Helper: Add user to Global Pool
async function joinPool(memberId, poolName) {
    let globalPool = await GlobalPool.findOne({ poolName });
    if (!globalPool) globalPool = new GlobalPool({ poolName });
    globalPool.activeQueue.push({ memberId, addedAt: new Date() });
    await globalPool.save();
}

// Check and Update Rank (Gold, Platinum, Ruby, Diamond) recursively up the sponsor tree
async function updateRankStatus(sponsor) {
    let currentSponsor = sponsor;
    while (currentSponsor) {
        let promoted = false;

        const directs = await User.find({ sponsorId: currentSponsor.memberId });
        
        // GOLD (ANY 2 Directs)
        if (directs.length >= 2 && !currentSponsor.isGold) {
            currentSponsor.isGold = true;
            await joinPool(currentSponsor.memberId, 'GOLD');
            promoted = true;
        }

        // PLATINUM (2 Gold Directs)
        const goldDirects = directs.filter(d => d.isGold);
        if (goldDirects.length >= 2 && !currentSponsor.isPlatinum) {
            currentSponsor.isPlatinum = true;
            await joinPool(currentSponsor.memberId, 'PLATINUM');
            promoted = true;
        }

        // RUBY (5 Platinum Directs)
        const platinumDirects = directs.filter(d => d.isPlatinum);
        if (platinumDirects.length >= 5 && !currentSponsor.isRuby) {
            currentSponsor.isRuby = true;
            await joinPool(currentSponsor.memberId, 'RUBY');
            promoted = true;
        }

        // DIAMOND (5 Ruby Directs)
        const rubyDirects = directs.filter(d => d.isRuby);
        if (rubyDirects.length >= 5 && !currentSponsor.isDiamond) {
            currentSponsor.isDiamond = true;
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
        // Business Plan Rule: Equal distribution among active non-working members (no team commissions) until ₹1000 joining fee is recovered
        const eligibleCashbackUsers = await User.find({ 
            directReferralsCount: 0,
            totalPairsMatched: 0,
            cashbackEarnings: { $lt: 1000 },
            isActive: true, 
            isRebirth: false 
        });

        if (eligibleCashbackUsers.length > 0) {
            const rawShare = nwPool.totalFund / eligibleCashbackUsers.length;
            for (const user of eligibleCashbackUsers) {
                const currentEarnings = user.cashbackEarnings || 0;
                const maxAllowed = 1000 - currentEarnings;
                const amountToGive = Math.min(rawShare, maxAllowed);
                
                if (amountToGive > 0) {
                    user.cashbackEarnings = currentEarnings + amountToGive;
                    await user.save();
                    await addIncome(user, amountToGive, 'CASHBACK', `Daily Non-Working Cashback (Total: ₹${user.cashbackEarnings}/1000)`);
                }
            }
        }
        nwPool.totalFund = 0;
        await nwPool.save();
    }

    // 3. Reset Binary Daily Capping & Flushed Counts
    await User.updateMany({}, { todayPairsCount: 0, todayPairsFlushedCount: 0 });
}

module.exports = { activateUser, addIncome, processDailyPools };
