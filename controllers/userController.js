const User = require('../models/User');
const { generateToken } = require('../utils/token');

// Lấy thông tin user hiện tại từ token
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// Tài khoản chính tạo tài khoản phụ
exports.createSubUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

        const newUser = await User.create({
            email,
            password,
            role: 'sub',
        });

        res.status(201).json({ message: 'Tạo tài khoản phụ thành công', user: newUser });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
