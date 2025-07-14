const mongoose = require('mongoose');

/**
 * @typedef {Object} AdminLog
 * @property {mongoose.Types.ObjectId} admin_id - ID của quản trị viên thực hiện hành động (tham chiếu tới User).
 * @property {string} action - Mô tả hành động mà admin đã thực hiện.
 * @property {Date} created_at - Thời điểm ghi nhận hành động (mặc định là thời gian hiện tại).
 */

/**
 * Schema lưu nhật ký hoạt động của quản trị viên.
 * Dùng để theo dõi các thao tác hệ thống do admin thực hiện.
 */
const AdminLogSchema = new mongoose.Schema({
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'admin_logs' // Gán rõ tên collection trong MongoDB
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);
