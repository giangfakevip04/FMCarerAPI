/**
 * Model Mongoose cho nhật ký chăm sóc (Log).
 * Ghi nhận hoạt động chăm sóc theo lịch và trẻ, kèm người thực hiện.
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
        required: false // cho phép ghi log tự do
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activity: {
        type: String,
        required: [true, 'Hoạt động chăm sóc là bắt buộc']
    },
    note: {
        type: String
    },
    performedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
