const mongoose = require('mongoose');

/**
 * @typedef {Object} Report
 * @property {mongoose.Types.ObjectId} reporter_id - ID người báo cáo bài viết.
 * @property {mongoose.Types.ObjectId} post_id - ID bài viết bị báo cáo.
 * @property {string} reason - Lý do báo cáo.
 * @property {'pending' | 'resolved' | 'dismissed'} status - Trạng thái xử lý báo cáo.
 * @property {Date} created_at - Thời điểm gửi báo cáo.
 */

/**
 * Schema dùng để lưu thông tin các báo cáo vi phạm bài viết.
 * Báo cáo sẽ được duyệt và xử lý bởi admin.
 */
const ReportSchema = new mongoose.Schema({
    reporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'reports' });

module.exports = mongoose.model('Report', ReportSchema);
