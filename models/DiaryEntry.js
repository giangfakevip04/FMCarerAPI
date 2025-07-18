/**
 * @fileoverview Mongoose schema cho nhật ký hoạt động của trẻ.
 * @module models/DiaryEntry
 */

const mongoose = require('mongoose');

/**
 * DiaryEntrySchema
 * Đại diện cho một mục ghi nhật ký hoạt động của trẻ (ăn, ngủ, chơi...).
 */
const DiaryEntrySchema = new mongoose.Schema({
    /**
     * ID của trẻ được ghi nhận hoạt động.
     * @type {mongoose.Types.ObjectId}
     */
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },

    /**
     * ID của người dùng (phụ huynh) ghi nhật ký.
     * @type {mongoose.Types.ObjectId}
     */
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    /**
     * Loại nhật ký (ví dụ: ăn, ngủ, vệ sinh, vui chơi...).
     * @type {string}
     */
    type: {
        type: String,
        required: true,
        trim: true
    },

    /**
     * Nội dung hoạt động cụ thể (ví dụ: uống sữa, đi ngủ...).
     * @type {string}
     */
    activity: {
        type: String,
        required: true,
        trim: true
    },

    /**
     * Có phải được tạo từ nhắc nhở không.
     * @type {boolean}
     * @default false
     */
    isFromReminder: {
        type: Boolean,
        default: false
    },

    /**
     * Nếu được tạo từ nhắc nhở, đây là ID của bản nhắc nhở gốc.
     * @type {mongoose.Types.ObjectId}
     */
    originalReminderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reminder',
        sparse: true,
        unique: true
    },

    /**
     * Thời gian tạo nhật ký (theo giờ Việt Nam, định dạng chuỗi).
     * @type {string}
     */
    local_time: {
        type: String,
        default: () => {
            const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            return vnDate.toISOString().replace('T', ' ').substring(0, 19);
        }
    }

}, {
    collection: 'diary_entries',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

/**
 * @typedef {Object} DiaryEntry
 * @property {mongoose.Types.ObjectId} child_id - ID trẻ liên quan
 * @property {mongoose.Types.ObjectId} user_id - ID người dùng ghi nhận
 * @property {string} type - Loại hoạt động
 * @property {string} activity - Nội dung chi tiết
 * @property {boolean} isFromReminder - Có phải từ nhắc nhở không
 * @property {mongoose.Types.ObjectId} [originalReminderId] - ID nhắc nhở gốc (nếu có)
 * @property {string} local_time - Thời gian theo giờ Việt Nam
 * @property {Date} created_at - Thời điểm tạo bản ghi (tự động)
 * @property {Date} updated_at - Thời điểm cập nhật bản ghi (tự động)
 */

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
