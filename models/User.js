/**
 * @file models/User.js
 * @description Mongoose schema định nghĩa cấu trúc người dùng cho hệ thống FMCarer.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
 * @returns {Date} - Thời gian hiện tại tại Việt Nam
 */
function getVietnamTime() {
    const now = new Date();
    now.setHours(now.getHours() + 7);
    return now;
}

/**
 * @typedef {Object} User
 * @property {string} email - Địa chỉ email người dùng (không yêu cầu cho subuser)
 * @property {string} password - Mật khẩu đã mã hóa
 * @property {'parent'|'subuser'|'admin'} role - Vai trò của người dùng
 * @property {mongoose.ObjectId|null} created_by - ID người dùng tạo ra (chỉ áp dụng với subuser)
 * @property {mongoose.Types.Decimal128} balance - Số dư tài khoản
 * @property {boolean} isVerified - Đã xác minh email hay chưa
 * @property {string} fullname - Họ tên đầy đủ
 * @property {string} numberphone - Số điện thoại (bắt buộc cho subuser)
 * @property {string} image - Đường dẫn ảnh đại diện
 * @property {boolean} isSuspended - Tài khoản có đang bị đình chỉ không
 * @property {Date} created_at - Thời điểm tạo tài khoản
 */

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function () { return this.role !== 'subuser'; },
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
        required: function () { return this.role === 'subuser'; },
        unique: function () { return this.role === 'subuser'; },
        sparse: true
    },
    image: {
        type: String,
        default: ''
    },
    isSuspended: {
        type: Boolean,
        default: false,
        index: true
    },
    created_at: {
        type: Date,
        default: getVietnamTime
    }
}, {
    collection: 'users'
});

/**
 * Mongoose middleware: Hash mật khẩu trước khi lưu nếu nó đã bị thay đổi.
 * @function
 * @name UserSchema.pre('save')
 */
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

/**
 * So sánh mật khẩu do người dùng nhập với mật khẩu đã mã hóa trong CSDL.
 * @param {string} candidatePassword - Mật khẩu đầu vào từ người dùng
 * @returns {Promise<boolean>} - Trả về true nếu khớp, ngược lại false
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
