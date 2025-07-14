/**
 * Định tuyến xác thực OTP qua email.
 * Base path: /api/users/send-otp
 */

const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

/**
 * @route POST /api/users/send-otp
 * @desc Gửi mã OTP đến email người dùng
 * @access Public
 */
router.post('/send-otp', otpController.sendOtpToEmail);

module.exports = router;
