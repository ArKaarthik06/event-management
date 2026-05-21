const express = require('express');
const router = express.Router();
const { getLogin, postLogin, getSignup, postSignup, logout } = require('../controllers/authController');

router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/signup', getSignup);
router.post('/signup', postSignup);
router.get('/logout', logout);

module.exports = router;
