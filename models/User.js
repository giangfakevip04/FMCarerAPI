const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs để xử lý mật khẩu

/**
 * @desc Định nghĩa schema cho User, lưu trữ thông tin người dùng (parent, subuser, admin).
 * @typedef {Object} User
 * @property {string} [email] - Email của người dùng, bắt buộc với parent và admin, duy nhất nếu có.
 * @property {string} password - Mật khẩu đã được hash của người dùng.
 * @property {string} role - Vai trò của người dùng: 'parent', 'subuser', hoặc 'admin'.
 * @property {mongoose.Schema.Types.ObjectId} [created_by] - ID của người dùng tạo ra (dùng cho subuser).
 * @property {mongoose.Decimal128} balance - Số dư tài khoản, mặc định là 0.00.
 * @property {boolean} isVerified - Trạng thái xác minh tài khoản, mặc định là false.
 * @property {string} fullname - Tên đầy đủ của người dùng, mặc định là chuỗi rỗng.
 * @property {string} [numberphone] - Số điện thoại, bắt buộc và duy nhất với subuser.
 * @property {string} image - Đường dẫn ảnh đại diện, mặc định là chuỗi rỗng.
 * @property {boolean} isSuspended - Trạng thái đình chỉ tài khoản, mặc định là false.
 * @property {Date} created_at - Thời gian tạo tài khoản, mặc định là thời điểm hiện tại.
 * @property {Object} _id - ID tự động của document trong MongoDB.
 */
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function () {
            return this.role !== 'subuser'; // Subuser không cần email
        },
        unique: true,
        sparse: true, // Chỉ enforce unique nếu có giá trị
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
            return this.role === 'subuser'; // Subuser bắt buộc có số điện thoại
        },
        unique: function () {
            return this.role === 'subuser'; // Unique chỉ cho subuser
        },
        sparse: true
    },

    image: {
        type: String,
        default: ''
    },

    // THÊM TRƯỜNG isSuspended VÀO ĐÂY
    isSuspended: {
        type: Boolean,
        default: false, // Mặc định là không bị đình chỉ
        index: true // Thêm index để truy vấn nhanh hơn
    },

    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'users'
});

// THÊM CÁC PHƯƠNG THỨC TRƯỚC KHI COMPILE MODEL (ví dụ: hash mật khẩu, so sánh mật khẩu)

/**
 * @desc Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu.
 * @param {Function} next - Hàm middleware tiếp theo trong chuỗi.
 * @returns {Promise<void>} - Gọi next() sau khi mã hóa mật khẩu.
 * @throws {Error} - Lỗi nếu quá trình mã hóa mật khẩu thất bại.
 */
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

/**
 * @desc So sánh mật khẩu người dùng nhập với mật khẩu đã hash.
 * @method comparePassword
 * @param {string} candidatePassword - Mật khẩu cần so sánh.
 * @returns {Promise<boolean>} - Trả về true nếu mật khẩu khớp, false nếu không.
 * @throws {Error} - Lỗi nếu quá trình so sánh mật khẩu thất bại.
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);