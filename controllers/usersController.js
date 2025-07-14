/**
 * @file controllers/usersController.js
 * @description Xử lý logic cho người dùng chính (parent) và tài khoản phụ (subuser).
 */

const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/token');

/**
 * Lấy danh sách toàn bộ người dùng (ẩn mật khẩu).
 * @route GET /api/users/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công.', users });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách user:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng.' });
    }
};

/**
 * Đăng ký tài khoản chính (parent).
 * @route POST /api/users/register
 */
exports.registerParent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email,
            password: hashedPassword,
            isVerified: true,
            role: 'parent'
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công.',
            user: {
                _id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname || '',
                numberphone: newUser.numberphone || '',
                image: newUser.image || ''
            }
        });
    } catch (err) {
        console.error('Lỗi đăng ký:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký tài khoản.' });
    }
};

/**
 * Đăng nhập bằng tài khoản chính (parent).
 * @route POST /api/users/login
 */
exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const user = await User.findOne({ email, role: 'parent' });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        const token = generateToken({ userId: user._id, role: user.role });
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                fullname: user.fullname,
                numberphone: user.numberphone,
                image: user.image
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập.' });
    }
};

/**
 * Cập nhật thông tin người dùng.
 * @route POST /api/users/update
 */
exports.updateUser = async (req, res) => {
    try {
        const { _id, fullname, numberphone, image } = req.body;
        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (fullname !== undefined) user.fullname = fullname;
        if (numberphone !== undefined) user.numberphone = numberphone;
        if (image !== undefined) user.image = image;

        await user.save();
        res.status(200).json({ success: true, message: 'Cập nhật thành công.', user });
    } catch (err) {
        console.error('Lỗi cập nhật:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng.' });
    }
};

/**
 * Upload ảnh đại diện cho người dùng.
 * @route POST /api/users/upload-avatar
 */
exports.uploadAvatar = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        user.image = imagePath;
        await user.save();

        res.status(200).json({ success: true, message: 'Tải ảnh lên thành công.', image: imagePath, user });
    } catch (err) {
        console.error('Lỗi upload avatar:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh.' });
    }
};

/**
 * Lấy danh sách subuser theo parentId.
 * @route GET /api/users/subusers/parent/:parentId
 */
exports.getAllSubusersByParentId = async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const subusers = await User.find({ created_by: parentId, role: 'subuser' });
        res.status(200).json({ success: true, data: subusers });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy subuser.' });
    }
};

/**
 * Lấy chi tiết 1 subuser theo ID.
 * @route GET /api/users/subuser/:subuserId
 */
exports.getSubuserById = async (req, res) => {
    try {
        const subuserId = req.params.subuserId;
        const subuser = await User.findById(subuserId);
        if (!subuser || subuser.role !== 'subuser') {
            return res.status(404).json({ message: 'Không tìm thấy subuser.' });
        }

        res.status(200).json({ success: true, user: subuser });
    } catch (err) {
        console.error('Lỗi khi lấy subuser:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

/**
 * Tạo hoặc cập nhật subuser dựa theo số điện thoại.
 * @route POST /api/users/subuser/create-or-update
 */
exports.createOrUpdateSubuser = async (req, res) => {
    try {
        const { numberphone, password, fullname, image, parentId } = req.body;
        const relationship = req.body.relationship || 'unknown';

        if (!numberphone || !password || !parentId) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'parentId không hợp lệ.' });
        }

        const parent = await User.findOne({ _id: parentId, role: 'parent' });
        if (!parent) {
            return res.status(400).json({ message: 'Không tìm thấy parent.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });

        if (subuser) {
            subuser.password = hashedPassword;
            subuser.fullname = fullname ?? subuser.fullname;
            subuser.image = image ?? subuser.image;
            subuser.relationship = relationship;
            await subuser.save();
            return res.status(200).json({ message: 'Cập nhật subuser thành công.', user: subuser });
        }

        const subuserCount = await User.countDocuments({ role: 'subuser', created_by: parentId });
        if (subuserCount >= 10) {
            return res.status(400).json({ message: 'Đã đạt giới hạn 10 subuser.' });
        }

        subuser = new User({
            numberphone,
            password: hashedPassword,
            fullname: fullname || '',
            image: image || '',
            role: 'subuser',
            created_by: parentId,
            relationship,
            email: null
        });

        await subuser.save();
        return res.status(201).json({ message: 'Tạo subuser thành công.', user: subuser });
    } catch (error) {
        console.error('Lỗi xử lý subuser:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * Xóa một subuser.
 * @route DELETE /api/users/subuser/:subuserId
 */
exports.deleteSubuser = async (req, res) => {
    try {
        const subuserId = req.params.subuserId;
        const deleted = await User.findOneAndDelete({ _id: subuserId, role: 'subuser' });

        if (!deleted) {
            return res.status(404).json({ message: 'Không tìm thấy subuser.' });
        }

        res.status(200).json({ message: 'Xóa subuser thành công.' });
    } catch (err) {
        console.error('Lỗi xóa subuser:', err);
        res.status(500).json({ message: 'Lỗi server khi xoá subuser.' });
    }
};

/**
 * Đăng nhập bằng subuser (số điện thoại).
 * @route POST /api/users/login-subuser
 */
exports.loginSubuser = async (req, res) => {
    try {
        const { numberphone, password } = req.body;
        if (!numberphone || !password) {
            return res.status(400).json({ message: 'Thiếu số điện thoại hoặc mật khẩu.' });
        }

        const user = await User.findOne({ numberphone, role: 'subuser' });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        res.status(200).json({ message: 'Đăng nhập thành công!', user });
    } catch (err) {
        console.error('Lỗi đăng nhập subuser:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập subuser.' });
    }
};
