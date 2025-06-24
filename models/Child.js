/**
 * Model Mongoose cho trẻ em (Child).
 * Mỗi trẻ gắn với một tài khoản cha mẹ (parentId).
 */

const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên trẻ là bắt buộc']
    },
    birthDate: {
        type: Date,
        required: [true, 'Ngày sinh là bắt buộc']
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Giới tính là bắt buộc']
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);
