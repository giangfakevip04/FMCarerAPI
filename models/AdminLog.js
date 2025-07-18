/**
 * @fileoverview Mongoose schema cho bảng ghi nhật ký hành động của admin.
 * @module models/AdminLog
 */

const mongoose = require('mongoose');

/**
 * AdminLogSchema
 * Lưu lại các hành động được thực hiện bởi admin trong hệ thống.
 */
const AdminLogSchema = new mongoose.Schema({
    /**
     * ID của admin thực hiện hành động.
     * Liên kết tới model 'User'.
     * @type {mongoose.Types.ObjectId}
     */
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    /**
     * Mô tả hành động mà admin thực hiện (ví dụ: 'Xóa bài viết', 'Duyệt bài').
     * @type {string}
     */
    action: {
        type: String
    },

    /**
     * Thời điểm hành động được ghi nhận, mặc định theo giờ Việt Nam (GMT+7).
     * @type {Date}
     */
    created_at: {
        type: Date,
        default: () => {
            const vnTime = new Date();
            vnTime.setHours(vnTime.getHours() + 7); // Giờ Việt Nam
            return vnTime;
        }
    }
}, {
    collection: 'admin_logs' // Chỉ định tên collection trong MongoDB
});

/**
 * @typedef {Object} AdminLog
 * @property {mongoose.Types.ObjectId} admin_id - ID của admin
 * @property {string} action - Nội dung hành động
 * @property {Date} created_at - Ngày giờ tạo
 */

module.exports = mongoose.model('AdminLog', AdminLogSchema);
