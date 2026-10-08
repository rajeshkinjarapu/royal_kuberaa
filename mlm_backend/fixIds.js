require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/royal_kuberaa';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB.");
        
        const user1 = await User.findOneAndUpdate({ memberId: '9502924437' }, { memberId: 'RK0305' });
        if (user1) console.log("Updated TULASI KALYANI to RK0305");
        else console.log("User 9502924437 not found");

        const user2 = await User.findOneAndUpdate({ memberId: 'RK38919' }, { memberId: 'RK201996' });
        if (user2) console.log("Updated RAJESH KINJARAPU to RK201996");
        else console.log("User RK38919 not found");

        console.log("Finished updating existing users.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
