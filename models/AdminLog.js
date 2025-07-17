const mongoose = require('mongoose');

/**
 * @desc Định nghĩa schema cho AdminLog, lưu trữ các hành động của Admin.
 * @typedef {Object} AdminLog
 * @property {mongoose.Schema.Types.ObjectId} admin_id - ID của Admin thực hiện hành động, tham chiếu đến model User.
 * @property {string} action - Mô tả hành động mà Admin đã thực hiện.
 * @property {Date} created_at - Thời gian hành động được ghi lại, mặc định là thời điểm hiện tại.
 * @property {Object} _id - ID tự động của document trong MongoDB.
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
}, { collection: 'admin_logs' });

module.exports = mongoose.model('AdminLog', AdminLogSchema);