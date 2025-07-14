const mongoose = require('mongoose');

/**
 * @typedef {Object} User
 * @property {string} email - Địa chỉ email (bắt buộc với parent/admin, không yêu cầu với subuser).
 * @property {string} password - Mật khẩu đã mã hóa.
 * @property {'parent' | 'subuser' | 'admin'} role - Vai trò người dùng.
 * @property {mongoose.Types.ObjectId|null} created_by - ID người tạo (dành cho subuser).
 * @property {number} balance - Số dư tài khoản.
 * @property {boolean} isVerified - Trạng thái đã xác minh tài khoản.
 * @property {string} fullname - Họ tên người dùng.
 * @property {string} numberphone - Số điện thoại (bắt buộc với subuser).
 * @property {string} image - Đường dẫn ảnh đại diện.
 * @property {Date} created_at - Ngày tạo tài khoản.
 */

/**
 * Schema người dùng của hệ thống.
 * Gồm các loại: parent (tài khoản chính), subuser (tài khoản phụ), admin.
 */
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function () {
            return this.role !== 'subuser';
        },
        unique: true,
        sparse: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['parent', 'subuser', 'admin'],
        default: 'parent',
        index: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    balance: {
        type: mongoose.Decimal128,
        default: 0.00
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    fullname: {
        type: String,
        default: ''
    },
    numberphone: {
        type: String,
        required: function () {
            return this.role === 'subuser';
        },
        unique: function () {
            return this.role === 'subuser';
        },
        sparse: true
    },
    image: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'users'
});

module.exports = mongoose.model('User', UserSchema);
