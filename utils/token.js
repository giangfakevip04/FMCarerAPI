/**
 * Tạo JWT token từ thông tin người dùng.
 * Token được dùng để xác thực người dùng trong các route bảo vệ.
 *
 * @param {Object} user - Thông tin người dùng (có _id và role)
 * @returns {string} - Chuỗi JWT token
 */
const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};
