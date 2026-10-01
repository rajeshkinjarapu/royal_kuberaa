const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/royalkuberaa')
    .then(async () => {
        console.log('Connected to MongoDB');
        await mongoose.connection.db.dropDatabase();
        console.log('Dropped old royalkuberaa database completely.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
