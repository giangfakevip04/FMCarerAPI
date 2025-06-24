/**
 * Model Mongoose cho giao dịch thanh toán (Payment).
 * Gắn với user, ghi nhận số tiền và thời gian thanh toán.
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền là bắt buộc']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
