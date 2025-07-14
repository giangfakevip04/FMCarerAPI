const mongoose = require('mongoose');

/**
 * @typedef {Object} Reminder
 * @property {mongoose.Types.ObjectId} user_id - ID người dùng tạo nhắc nhở.
 * @property {mongoose.Types.ObjectId} child_id - ID trẻ được nhắc nhở.
 * @property {'eat' | 'sleep' | 'bathe' | 'vaccine' | 'other'} type - Loại nhắc nhở.
 * @property {string|null} custom_type - Loại nhắc nhở tùy chỉnh (bắt buộc nếu type là 'other').
 * @property {string} [note] - Ghi chú thêm về nhắc nhở.
 * @property {Date} reminder_date - Ngày thực hiện nhắc nhở.
 * @property {string} reminder_time - Giờ thực hiện nhắc nhở (ví dụ: '14:30').
 * @property {boolean} repeat - Có lặp lại hay không.
 * @property {'none' | 'daily' | 'weekly' | 'monthly'} repeat_type - Kiểu lặp lại nếu có.
 * @property {boolean} is_completed - Trạng thái hoàn thành của nhắc nhở.
 */

/**
 * Schema quản lý nhắc nhở (reminder) của người dùng cho từng trẻ.
 * Cho phép thiết lập lịch lặp lại và phân biệt loại hoạt động.
 */
const ReminderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    type: {
        type: String,
        enum: ['eat', 'sleep', 'bathe', 'vaccine', 'other'],
        required: true
    },
    custom_type: {
        type: String,
        default: null,
        validate: {
            validator: function (value) {
                if (this.type === 'other') {
                    return value && value.trim().length > 0;
                }
                return true;
            },
            message: 'custom_type là bắt buộc nếu type là "other".'
        }
    },
    note: {
        type: String
    },
    reminder_date: {
        type: Date,
        required: true
    },
    reminder_time: {
        type: String,
        required: true
    },
    repeat: {
        type: Boolean,
        default: false
    },
    repeat_type: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    },
    is_completed: {
        type: Boolean,
        default: false
    }
}, { collection: 'reminders' });

module.exports = mongoose.model('Reminder', ReminderSchema);
