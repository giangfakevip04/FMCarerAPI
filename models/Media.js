const mongoose = require('mongoose');

/**
 * @typedef {Object} Media
 * @property {'image' | 'video' | 'file'} type - Loại phương tiện: hình ảnh, video hoặc tệp đính kèm.
 * @property {string} file_url - Đường dẫn URL của tệp được tải lên.
 * @property {mongoose.Types.ObjectId} [post_id] - ID bài viết chứa media (nếu có).
 * @property {mongoose.Types.ObjectId} [diary_entry_id] - ID nhật ký chứa media (nếu có).
 * @property {Date} uploaded_at - Thời điểm tải lên media (mặc định là thời gian hiện tại).
 */

/**
 * Schema lưu trữ thông tin các tệp phương tiện (media) như ảnh, video, file.
 * Media có thể liên kết với bài viết (`Post`) hoặc nhật ký (`DiaryEntry`).
 */
const MediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['image', 'video', 'file'],
        required: true
    },
    file_url: {
        type: String,
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    diary_entry_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiaryEntry'
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'media' });

module.exports = mongoose.model('Media', MediaSchema);
