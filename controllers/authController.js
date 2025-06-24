const User = require('../models/User');
const { generateToken } = require('../utils/token');

exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

        const user = await User.create({ email, password, role });
        const token = generateToken(user);
        res.status(201).json({ user, token });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
        }
        const token = generateToken(user);
        res.status(200).json({ user, token });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
