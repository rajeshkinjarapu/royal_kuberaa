require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/royal_kuberaa';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB.");
        
        const user1 = await User.findOneAndUpdate({ mobile: '9491324437' }, { memberId: 'RK0305' });
        if (user1) console.log("Updated 9491324437 to RK0305");
        else console.log("User 9491324437 not found");

        const user2 = await User.findOneAndUpdate({ mobile: '9502924437' }, { memberId: 'RK201996' });
        if (user2) console.log("Updated 9502924437 to RK201996");
        else console.log("User 9502924437 not found");

        console.log("Finished updating existing users.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
