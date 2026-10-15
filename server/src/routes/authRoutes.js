const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginValidationRules, validateRequest } = require('../middleware/validators');

router.post('/login', loginValidationRules, validateRequest, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
