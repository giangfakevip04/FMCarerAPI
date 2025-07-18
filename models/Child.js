/**
 * @fileoverview Mongoose schema cho thông tin trẻ nhỏ do người dùng quản lý.
 * @module models/Child
 */

const mongoose = require('mongoose');

/**
 * ChildSchema
 * Đại diện cho một đứa trẻ được quản lý trong hệ thống bởi người dùng.
 */
const ChildSchema = new mongoose.Schema({
    /**
     * ID của người dùng quản lý trẻ này.
     * @type {mongoose.Types.ObjectId}
     */
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    /**
     * Tên trẻ.
     * @type {string}
     */
    name: {
        type: String,
        required: true,
        maxlength: 100
    },

    /**
     * Ngày sinh của trẻ.
     * @type {Date}
     */
    dob: {
        type: Date,
        required: true
    },

    /**
     * Giới tính của trẻ.
     * @type {'male' | 'female' | 'other'}
     */
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },

    /**
     * Ảnh đại diện của trẻ (nếu có).
     * @type {string}
     */
    avatar_url: {
        type: String
    },

    /**
     * Ngày tạo bản ghi (theo giờ Việt Nam).
     * @type {Date}
     */
    created_at: {
        type: Date
    }
}, {
    collection: 'children',
    timestamps: false // Không dùng createdAt/updatedAt mặc định
});

/**
 * Middleware trước khi lưu: gán created_at nếu chưa có,
 * theo múi giờ GMT+7 (giờ Việt Nam).
 */
ChildSchema.pre('save', function (next) {
    if (!this.created_at) {
        this.created_at = new Date(Date.now() + 7 * 60 * 60 * 1000); // GMT+7
    }
    next();
});

/**
 * @typedef {Object} Child
 * @property {mongoose.Types.ObjectId} user_id - ID người dùng quản lý
 * @property {string} name - Tên trẻ
 * @property {Date} dob - Ngày sinh
 * @property {'male' | 'female' | 'other'} gender - Giới tính
 * @property {string} [avatar_url] - Ảnh đại diện (nếu có)
 * @property {Date} created_at - Ngày tạo
 */

module.exports = mongoose.model('Child', ChildSchema);
