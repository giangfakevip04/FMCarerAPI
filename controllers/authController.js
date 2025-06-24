/**
 * Controller xử lý đăng ký và đăng nhập người dùng.
 * Bao gồm: tạo tài khoản mới, đăng nhập trả về JWT token.
 */

const User = require('../models/User');
const { generateToken } = require('../utils/token');

/**
 * Đăng ký người dùng mới.
 *
 * @param {Object} req - Yêu cầu HTTP (Request)
 * @param {Object} res - Phản hồi HTTP (Response)
 * @returns {JSON} - Trả về user đã tạo và token JWT
 */
exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Tạo user mới và lưu vào database
        const user = await User.create({ email, password, role });

        // Tạo JWT token từ thông tin người dùng
        const token = generateToken(user);

        // Trả về user (ẩn password) và token
        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt
            },
            token
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

/**
 * Đăng nhập người dùng đã có tài khoản.
 *
 * @param {Object} req - Yêu cầu HTTP (Request)
 * @param {Object} res - Phản hồi HTTP (Response)
 * @returns {JSON} - Trả về user và token JWT nếu đúng email & password
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email không tồn tại' });
        }

        // So sánh mật khẩu nhập vào với mật khẩu đã mã hoá
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        // Tạo token và trả về cùng thông tin user
        const token = generateToken(user);
        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt
            },
            token
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
