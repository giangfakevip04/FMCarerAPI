const mongoose = require('mongoose');

/**
 * @typedef {Object} Notification
 * @property {mongoose.Types.ObjectId} user_id - ID người dùng nhận thông báo (tham chiếu đến bảng `User`).
 * @property {string} message - Nội dung thông báo gửi tới người dùng.
 * @property {'reminder' | 'system' | 'post'} type - Loại thông báo: nhắc nhở, hệ thống, hoặc bài viết.
 * @property {boolean} is_read - Trạng thái đã đọc hay chưa (mặc định là chưa đọc).
 * @property {Date} created_at - Thời điểm tạo thông báo.
 */

/**
 * Schema lưu trữ thông báo gửi tới người dùng trong hệ thống.
 * Có thể dùng để gửi thông báo về nhắc nhở, bài viết mới, hoặc sự kiện hệ thống.
 */
const NotificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['reminder', 'system', 'post'],
        default: 'system'
    },
    is_read: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'notifications' });

module.exports = mongoose.model('Notification', NotificationSchema);
