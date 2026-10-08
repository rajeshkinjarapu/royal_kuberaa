const mongoose = require('mongoose');
const User = require('./models/User');
const MatrixNode = require('./models/MatrixNode');
const Transaction = require('./models/Transaction');
const FundRequest = require('./models/FundRequest');
const Withdrawal = require('./models/Withdrawal');

mongoose.connect('mongodb://127.0.0.1:27017/royal_kuberaa')
    .then(async () => {
        console.log("Connected to MongoDB.");

        const oldId = '9502924437';
        const newId = 'RK0305';

        // Check if old ID exists
        const oldUser = await User.findOne({ memberId: oldId });
        const newUser = await User.findOne({ memberId: newId });

        if (newUser && oldUser) {
            console.log(`${newId} already exists! Deleting the dummy ${newId}...`);
            await User.deleteOne({ _id: newUser._id });
        }

        if (oldUser) {
            oldUser.memberId = newId;
            oldUser.sponsorId = ''; // Remove sponsor
            oldUser.name = 'Company Top Leader';
            await oldUser.save();
            console.log(`Successfully renamed ${oldId} to ${newId}.`);

            // Update related records
            await User.updateMany({ sponsorId: oldId }, { $set: { sponsorId: newId } });
            await MatrixNode.updateMany({ memberId: oldId }, { $set: { memberId: newId } });
            await MatrixNode.updateMany({ sponsorId: oldId }, { $set: { sponsorId: newId } });
            await Transaction.updateMany({ memberId: oldId }, { $set: { memberId: newId } });
            await FundRequest.updateMany({ memberId: oldId }, { $set: { memberId: newId } });
            await Withdrawal.updateMany({ memberId: oldId }, { $set: { memberId: newId } });
            
            console.log("Updated all references in tree and transactions.");
        } else {
            console.log(`${oldId} not found, maybe already renamed.`);
            if (newUser) {
                newUser.sponsorId = '';
                newUser.name = 'Company Top Leader';
                await newUser.save();
                console.log(`${newId} is now set as the top leader with no sponsor.`);
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
