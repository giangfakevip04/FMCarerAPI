/**
 * @fileoverview Mongoose schema cho bài viết trong mạng xã hội FMCarer.
 * @module models/Post
 */

const mongoose = require('mongoose');
const moment = require('moment-timezone'); // Dùng để lấy giờ Việt Nam
const Schema = mongoose.Schema;

/**
 * PostSchema
 * Đại diện cho một bài đăng (post) của người dùng trong cộng đồng.
 */
const PostSchema = new Schema({
    /**
     * ID của người đăng bài.
     * @type {mongoose.Types.ObjectId}
     */
    id_user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    /**
     * Tên đầy đủ của người đăng bài (tùy chọn, có thể để trống).
     * @type {string}
     */
    fullname: {
        type: String,
        required: false,
        default: ''
    },

    /**
     * Ảnh đại diện người dùng tại thời điểm đăng (nếu có).
     * @type {string}
     */
    image: {
        type: String,
        required: false
    },

    /**
     * Nội dung văn bản của bài viết.
     * @type {string}
     */
    content: {
        type: String,
        required: true
    },

    /**
     * Danh sách các URL media đính kèm (ảnh, video...).
     * @type {string[]}
     */
    media_urls: [{
        type: String
    }],

    /**
     * Quyền hiển thị bài viết.
     * - `public`: công khai
     * - `private`: chỉ mình tôi
     * - `friends`: bạn bè
     * - `community`: cộng đồng (cần kiểm duyệt)
     * @type {'public'|'private'|'friends'|'community'}
     */
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends', 'community'],
        default: 'public'
    },

    /**
     * Trạng thái bài viết.
     * - `pending`: chờ duyệt (áp dụng với visibility = 'community')
     * - `active`: đã được duyệt hoặc không cần duyệt
     * - `rejected`: bị từ chối
     * @type {'pending'|'active'|'rejected'}
     */
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'active'
    },

    /**
     * Lý do từ chối bài viết (nếu có).
     * @type {string|null}
     */
    rejectionReason: {
        type: String,
        default: null
    },

    /**
     * Tổng số bình luận bài viết có.
     * @type {number}
     */
    total_comments: {
        type: Number,
        default: 0
    },

    /**
     * Tổng số lượt thích của bài viết.
     * @type {number}
     */
    total_likes: {
        type: Number,
        default: 0
    },

    /**
     * Thời gian tạo bài viết theo giờ Việt Nam (Asia/Ho_Chi_Minh).
     * @example '2025-07-18 13:45:22'
     * @type {string}
     */
    created_time_vn: {
        type: String,
        default: () =>
            moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
    }

}, {
    collection: 'posts',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

/**
 * @typedef {Object} Post
 * @property {mongoose.Types.ObjectId} id_user - ID người đăng
 * @property {string} fullname - Tên đầy đủ của người đăng
 * @property {string} [image] - Ảnh đại diện (nếu có)
 * @property {string} content - Nội dung bài viết
 * @property {string[]} media_urls - Danh sách ảnh/video
 * @property {'public'|'private'|'friends'|'community'} visibility - Quyền hiển thị
 * @property {'pending'|'active'|'rejected'} status - Trạng thái
 * @property {string|null} rejectionReason - Lý do từ chối (nếu có)
 * @property {number} total_comments - Số bình luận
 * @property {number} total_likes - Số lượt thích
 * @property {string} created_time_vn - Giờ tạo theo múi giờ VN
 * @property {Date} created_at - Ngày tạo (UTC)
 * @property {Date} updated_at - Ngày cập nhật (UTC)
 */

module.exports = mongoose.model('Post', PostSchema);
