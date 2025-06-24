/**
 * Model Mongoose cho bài viết chia sẻ.
 * Bài viết có thể là nội bộ (gia đình) hoặc công khai (cộng đồng).
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Nội dung bài viết là bắt buộc']
    },
    level: {
        type: String,
        enum: ['family', 'public'],
        default: 'family'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);
