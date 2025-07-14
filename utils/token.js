require('dotenv').config(); // Đọc biến môi trường từ .env
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Tạo JWT token từ payload.
 *
 * @param {Object} payload - Dữ liệu cần mã hóa
 * @param {string} [expiresIn='7d'] - Thời hạn token (mặc định: 7 ngày)
 * @returns {string} - JWT token đã ký
 */
exports.generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, SECRET, { expiresIn });
};

/**
 * Xác thực token JWT.
 *
 * @param {string} token - Token JWT cần kiểm tra
 * @returns {Object|null} - Payload đã giải mã nếu hợp lệ, hoặc null nếu sai
 */
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET);
    } catch (err) {
        console.error("❌ Lỗi trong verifyToken:", err.message);
        return null;
    }
};
