const mongoose = require('mongoose');

/**
 * @typedef {Object} DiaryEntry
 * @property {mongoose.Types.ObjectId} child_id - ID của trẻ liên quan đến nhật ký (tham chiếu tới `Child`).
 * @property {mongoose.Types.ObjectId} user_id - Người ghi nhận nhật ký (có thể là cha mẹ, hoặc người hoàn thành nhắc nhở).
 * @property {string} type - Loại nhật ký (ví dụ: ăn, ngủ, tắm, tiêm chủng, ghi chú, mốc phát triển...).
 * @property {string} activity - Mô tả chi tiết nội dung hoạt động trong nhật ký.
 * @property {boolean} isFromReminder - Cho biết nhật ký này có được tạo tự động từ nhắc nhở hay không.
 * @property {mongoose.Types.ObjectId} [originalReminderId] - ID của nhắc nhở gốc nếu nhật ký được tạo từ reminder.
 * @property {Date} created_at - Thời gian tạo (tự động bởi mongoose).
 * @property {Date} updated_at - Thời gian cập nhật gần nhất (tự động bởi mongoose).
 */

/**
 * Schema cho nhật ký hoạt động của trẻ.
 * Có thể được tạo thủ công hoặc sinh tự động từ nhắc nhở đã hoàn thành.
 */
const DiaryEntrySchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        trim: true
        // enum: ['eat', 'sleep', 'bathe', 'vaccine', 'milestone', 'note', 'other']
    },
    activity: {
        type: String,
        required: true,
        trim: true
    },
    isFromReminder: {
        type: Boolean,
        default: false
    },
    originalReminderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
        sparse: true,
        unique: true
    }
}, {
    collection: 'diary_entries',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
