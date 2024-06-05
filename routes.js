const express = require('express');
const router = express.Router();
const { authenticate, getWallet, updateWallet, logout, startgame, getUsername, openTile, handleCashout, handleDeposit, handleWithdraw } = require('./users');
const jwt = require('jsonwebtoken')

router.post('/authenticate', authenticate);
router.get('/wallet', authenticateToken, getWallet);
router.post('/wallet', authenticateToken, updateWallet);
router.post('/logout', authenticateToken, logout);
router.post('/startgame', authenticateToken, startgame);
router.get('/username', authenticateToken, getUsername);
router.post('/opentile', authenticateToken, openTile);
router.post('/cashout', authenticateToken, handleCashout);
router.post('/deposit', authenticateToken, handleDeposit)
router.post('/withdraw', authenticateToken, handleWithdraw);

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = router;
