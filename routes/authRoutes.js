/**
 * Định nghĩa các endpoint xác thực người dùng: đăng ký và đăng nhập.
 * Base path: /api/auth
 */

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

/**
 * @route POST /api/auth/register
 * @desc Đăng ký người dùng mới
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Đăng nhập, trả về token
 * @access Public
 */
router.post('/login', login);

module.exports = router;
