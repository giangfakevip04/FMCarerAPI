const { verifyToken } = require('../utils/token');

/**
 * @desc Middleware xác thực quyền Admin dựa trên JWT token.
 * @param {Object} req - Yêu cầu HTTP chứa token trong cookie.
 * @param {Object} req.cookies - Đối tượng cookie chứa token.
 * @param {string} [req.cookies.token] - JWT token của người dùng.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @param {Function} next - Hàm middleware tiếp theo trong chuỗi.
 * @returns {void} - Chuyển hướng đến trang đăng nhập nếu xác thực thất bại, hoặc gọi next() nếu thành công.
 * @throws {Error} - Lỗi nếu token không hợp lệ hoặc không thể xác thực.
 */
exports.requireAdmin = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        console.warn('❌ Không có token trong cookie');
        return res.redirect('/admin/login');
    }

    try {
        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'admin') {
            console.warn('❌ Token không hợp lệ hoặc người dùng không phải admin');
            res.clearCookie('token'); // Xóa token sai
            return res.redirect('/admin/login');
        }

        // ✅ Gán thông tin admin vào request để sử dụng ở các middleware tiếp theo
        req.user = decoded;
        console.log(`✅ Admin xác thực: ${decoded.email}`);
        next();
    } catch (err) {
        console.error('❌ Lỗi xác thực token:', err.message);
        res.clearCookie('token'); // Token hỏng => xóa
        return res.redirect('/admin/login');
    }
};