const mongoose = require('mongoose');

/**
 * @typedef {Object} SupportTicket
 * @property {mongoose.Types.ObjectId} user_id - ID người gửi yêu cầu hỗ trợ.
 * @property {string} subject - Tiêu đề yêu cầu.
 * @property {string} message - Nội dung chi tiết của yêu cầu hỗ trợ.
 * @property {'open' | 'in_progress' | 'closed'} status - Trạng thái xử lý ticket.
 * @property {Date} created_at - Thời điểm tạo ticket.
 * @property {Date} updated_at - Thời điểm cập nhật gần nhất.
 */

/**
 * Schema dùng để người dùng gửi yêu cầu hỗ trợ đến đội ngũ quản trị.
 */
const SupportTicketSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'closed'],
        default: 'open'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'support_tickets' });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
