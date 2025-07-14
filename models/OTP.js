const mongoose = require('mongoose');

/**
 * @typedef {Object} OTP
 * @property {string} email - Email của người dùng muốn xác thực.
 * @property {string} code - Mã OTP (gồm 6 chữ số).
 * @property {Date} expiresAt - Thời gian hết hạn của mã OTP.
 */

/**
 * Schema lưu trữ mã xác thực OTP được gửi tới email người dùng.
 * Được sử dụng để xác minh email khi đăng ký hoặc thực hiện thao tác quan trọng.
 */
const OTPSchema = new mongoose.Schema({
    email: String,
    code: String,
    expiresAt: Date
}, { collection: 'otps' });

module.exports = mongoose.model('OTP', OTPSchema);
