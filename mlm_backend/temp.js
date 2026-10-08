const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/royalkuberaa').then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ $or: [{mainWallet: {$gt: 0}}, {rebirthWallet: {$gt: 0}}] }).toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
});
