/**
 * Model Mongoose cho lịch chăm sóc (Schedule).
 * Lịch này gắn với trẻ (childId), do người dùng tạo (createdBy).
 */

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: [true, 'Thiếu mã trẻ']
    },
    type: {
        type: String,
        enum: ['eat', 'sleep', 'bath', 'vaccine', 'other'],
        required: [true, 'Loại lịch là bắt buộc']
    },
    time: {
        type: Date,
        required: [true, 'Thời gian là bắt buộc']
    },
    repeat: {
        type: String,
        enum: ['none', 'daily', 'weekly'],
        default: 'none'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
