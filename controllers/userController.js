/**
 * Controller quản lý người dùng.
 * Gồm: lấy thông tin profile, tài khoản chính tạo tài khoản phụ.
 */

const User = require('../models/User');

/**
 * Lấy thông tin người dùng hiện tại dựa vào token đã xác thực.
 *
 * @param {Object} req - Yêu cầu HTTP, có req.user từ middleware protect
 * @param {Object} res - Phản hồi HTTP
 * @returns {JSON} - Trả về thông tin người dùng (không bao gồm mật khẩu)
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

/**
 * Tài khoản chính tạo tài khoản phụ mới trong hệ thống.
 *
 * @param {Object} req - Yêu cầu HTTP, chứa email + password trong body
 * @param {Object} res - Phản hồi HTTP
 * @returns {JSON} - Trả về user mới tạo (role = sub)
 */
exports.createSubUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra trùng email
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

        // Tạo tài khoản phụ
        const subUser = await User.create({ email, password, role: 'sub' });

        res.status(201).json({
            message: 'Tạo tài khoản phụ thành công',
            user: {
                _id: subUser._id,
                email: subUser.email,
                role: subUser.role,
                status: subUser.status
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
