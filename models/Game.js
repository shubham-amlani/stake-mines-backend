const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    gameArray: {
        type: Array,
        required: true,
    },
    betamount: {
        type: Number,
        default: 0.00,
    },
    profit: {
        type: Number, 
        default: 0.00
    }, 
    multiple: {
        type: Number,
        default: 0.00
    },
    mines: {
        type: Number,
        required: true
    },
    openedArray: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model('Game', GameSchema);
