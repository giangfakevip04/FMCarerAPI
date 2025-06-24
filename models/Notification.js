/**
 * Model Mongoose cho thông báo hệ thống.
 * Gắn với người nhận (userId) và có trạng thái đọc/chưa đọc.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Nội dung thông báo là bắt buộc']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['system', 'schedule', 'reply', 'custom'],
        default: 'system'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
