const express = require('express');
const router = express.Router();
const { register, login, socialLogin, forgotPassword, resetPassword } = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
