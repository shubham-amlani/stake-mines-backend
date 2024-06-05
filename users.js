const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Game = require('./models/Game');

const SECRET_KEY = 'your_secret_key';

function generateRandomArrayWithOnes(n) {
    const arrayLength = 25;
    const array = new Array(arrayLength).fill(0); // Create an array filled with zeros

    // Generate n random indexes
    const randomIndexes = [];
    while (randomIndexes.length < n) {
        const randomIndex = Math.floor(Math.random() * arrayLength);
        if (!randomIndexes.includes(randomIndex)) {
            randomIndexes.push(randomIndex);
        }
    }

    // Set 1 at the random indexes
    randomIndexes.forEach(index => {
        array[index] = 1;
    });

    return array;
}

async function calculateProfit(username) {
    try {
        // Retrieve the game from the database based on the username
        const game = await Game.findOne({ username: username });
        if (!game) {
            throw new Error('Game not found');
        }

        // Calculate the number of mines (m) and gems (d) from the game data
        const mines = game.gameArray.filter(tile => tile === 1).length;
        const gems = game.openedArray.filter(tile => tile === 1).length;
        const m = mines;
        const d = gems;

        // Perform the profit calculation
        var n = 25;
        var x = 25 - m;

        function factorial(number) {
            var value = number;
            for (var i = number; i > 1; i--)
                value *= i - 1;
            return value;
        };

        function combination(n, d) {
            if (n == d) return 1;
            return factorial(n) / (factorial(d) * factorial(n - d));
        };

        var first = combination(n, d);
        var second = combination(x, d);
        var result = 0.99 * (first / second);
        result = Math.round(result * 100) / 100;

        return result;
    } catch (error) {
        console.error('Error calculating profit:', error);
        return null;
    }
}


exports.authenticate = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Ensure username and password are provided
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        let user = await User.findOne({ username });

        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({ username, password: hashedPassword });
            await user.save();
        } else {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1000h' });
        res.json({ token, balance: user.balance });
    } catch (error) {
        console.error('Error in authentication:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getWallet = async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).send('User not found');
    res.json({ balance: user.balance });
};

exports.updateWallet = async (req, res) => {
    const { amount } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).send('User not found');
    user.balance = amount;
    await user.save();
    res.json({ balance: user.balance });
};

exports.logout = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

exports.startgame = async (req, res) =>{
    const {mines, betamount, username} = req.body;
    const game = await Game.findOne({username: username});
    const user = await User.findOne({username: username});
    if(game){
        res.json({activegame: true});
    } else{
        await User.findOneAndUpdate({username: username}, {$set: {balance: user.balance-betamount}});
        const minearray = generateRandomArrayWithOnes(mines);
        const openedArray = Array(25).fill(0);
        const newGame = new Game({username: username, gameArray: minearray, betamount: betamount, mines: mines, openedArray: openedArray});

        await newGame.save().then(()=>{res.json({gamestart: true})}).catch((err)=>{res.json({starterror: true, message: "Cannot start a game due to some error"})});  
    }
};

exports.getUsername = async (req, res) =>{
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).send('User not found');
    res.json({ username: user.username });
}

exports.openTile = async (req, res) =>{
    const {tileCoords, username} = req.body;
    const game = await Game.findOne({username: username});
    const mine = game.gameArray[tileCoords];
    const newArray = game.openedArray;
    newArray[tileCoords] = 1;
    await Game.findOneAndUpdate({username: username}, {$set: {openedArray: newArray}});

    if(mine){
        const gameArray = game.gameArray;
        res.json({gem: false, mine: true, profit: 0, gameArray: gameArray});
        await Game.findOneAndDelete({username: username});
    } else{
        const profitMultiple = await calculateProfit(username);
        const profit = game.betamount * profitMultiple;
        await Game.findOneAndUpdate({username: username}, {$set: {multiple: profitMultiple, profit: profit}});
        res.json({gem: true, mine: false, profit: profitMultiple});
    }
}

exports.handleCashout = async (req, res)=>{
    const username = req.body.username;
    const game = await Game.findOne({username: username});
    const user = await User.findOne({username: username});
    const profit = game.profit;
    const gameArray = game.gameArray;
    await User.findOneAndUpdate({username: username}, {$set:{balance: user.balance+profit}});
    await Game.findOneAndDelete({username: username});
    res.json({cashout: true, balance: user.balance+profit, gameArray: gameArray});
}

exports.handleDeposit = async(req, res)=>{
    const {username, amount} = req.body;
    const user = await User.findOne({username: username});
    const balance = user.balance;
    const newBalance = Number(balance)+Number(amount);
    await User.findOneAndUpdate({username: username}, {$set: {balance: newBalance}});
    res.json({balance: newBalance});
}

exports.handleWithdraw = async(req, res)=>{
    const {username, amount} = req.body;
    const user = await User.findOne({username: username});
    const balance = user.balance;
    if(balance<amount){
        res.json({withdraw: false, message: 'Insufficient balance'});
    } else{
        const newBalance = balance - amount;
        await User.findOneAndUpdate({username: username}, {$set: {balance: newBalance}});
        res.json({balance: newBalance});
    }
}

exports.healthCheck = async(req, res)=>{
    res.status(200).send('OK');
}