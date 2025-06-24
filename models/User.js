/**
 * Model Mongoose cho người dùng.
 * Gồm các trường cơ bản: email, password (hash), role, status, createdAt.
 * Hỗ trợ so sánh mật khẩu đã hash.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc']
    },
    role: {
        type: String,
        enum: ['main', 'sub', 'admin'],
        default: 'main'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Tự động hash mật khẩu trước khi lưu vào database (nếu được chỉnh sửa).
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * So sánh mật khẩu nhập vào với mật khẩu đã mã hoá trong DB.
 *
 * @param {string} inputPassword - mật khẩu người dùng nhập
 * @returns {Promise<boolean>} - true nếu khớp, false nếu sai
 */
userSchema.methods.comparePassword = function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
