const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://admin-shubham:Shubham104@cluster0.2c4ogd3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/stake-mines', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
