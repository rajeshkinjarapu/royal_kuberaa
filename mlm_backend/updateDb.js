const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm_db';

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to DB');
    
    // Fix all users that were accidentally blocked by isActive logic instead of isBlocked
    await User.updateMany({}, { isBlocked: false });
    
    // Reset Top ID to not activated so user can test activation
    await User.updateOne({ memberId: '9502924437' }, { isActive: false });
    console.log('Top ID reset to isActive: false');

    mongoose.disconnect();
    console.log('Done');
});
