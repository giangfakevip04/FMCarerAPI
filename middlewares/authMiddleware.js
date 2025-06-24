/**
 * Middleware bảo vệ route yêu cầu đăng nhập và phân quyền người dùng.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware kiểm tra JWT token từ header.
 * Gắn thông tin user (decoded) vào `req.user` nếu token hợp lệ.
 *
 * @param {Object} req - HTTP Request
 * @param {Object} res - HTTP Response
 * @param {Function} next - Gọi hàm kế tiếp nếu hợp lệ
 */
exports.protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

/**
 * Middleware giới hạn quyền truy cập cho 1 số vai trò nhất định.
 *
 * @param  {...string} roles - Danh sách vai trò được phép (vd: ['admin', 'main'])
 * @returns Middleware function
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        next();
    };
};
