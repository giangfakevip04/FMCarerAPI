const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @typedef {Object} Post
 * @property {mongoose.Types.ObjectId} id_user - ID người đăng bài viết (tham chiếu tới User).
 * @property {string} fullname - Tên người đăng (lưu snapshot tại thời điểm đăng).
 * @property {string} image - Ảnh đại diện của người đăng (snapshot).
 * @property {string} content - Nội dung văn bản của bài viết.
 * @property {string[]} media_urls - Danh sách URL các ảnh hoặc video đính kèm.
 * @property {'public' | 'private' | 'friends'} visibility - Mức độ hiển thị bài viết.
 * @property {string} status - Trạng thái của bài viết (ví dụ: 'active', 'hidden').
 * @property {number} total_comments - Tổng số bình luận.
 * @property {number} total_likes - Tổng số lượt thích.
 * @property {Date} created_at - Ngày tạo bài viết.
 * @property {Date} updated_at - Ngày cập nhật gần nhất.
 */

/**
 * Schema lưu trữ bài viết người dùng đăng (giống mạng xã hội mini).
 * Có thể chứa ảnh, video, và các mức độ hiển thị.
 */
const PostSchema = new Schema({
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullname: {
        type: String,
        required: false,
        default: ''
    },
    image: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: true
    },
    media_urls: [{
        type: String
    }],
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
    },
    status: {
        type: String,
        default: 'active'
    },
    total_comments: {
        type: Number,
        default: 0
    },
    total_likes: {
        type: Number,
        default: 0
    }
}, {
    collection: 'posts',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Post', PostSchema);
