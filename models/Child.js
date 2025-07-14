const mongoose = require('mongoose');

/**
 * @typedef {Object} Child
 * @property {mongoose.Types.ObjectId} user_id - ID của người dùng (cha mẹ) sở hữu trẻ này (tham chiếu tới User).
 * @property {string} name - Tên của trẻ.
 * @property {Date} dob - Ngày sinh của trẻ.
 * @property {'male' | 'female' | 'other'} gender - Giới tính của trẻ (nam, nữ, hoặc khác).
 * @property {string} [avatar_url] - Đường dẫn ảnh đại diện của trẻ (nếu có).
 * @property {Date} created_at - Ngày tạo hồ sơ trẻ (mặc định là ngày hiện tại).
 */

/**
 * Schema đại diện cho thông tin một trẻ em trong hệ thống.
 * Mỗi trẻ gắn với một user cha/mẹ cụ thể.
 */
const ChildSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    avatar_url: {
        type: String // Đường dẫn ảnh đại diện nếu có
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'children' });

module.exports = mongoose.model('Child', ChildSchema);
