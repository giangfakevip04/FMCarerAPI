const mongoose = require('mongoose');

/**
 * @typedef {Object} Payment
 * @property {mongoose.Types.ObjectId} user_id - ID của người dùng thực hiện thanh toán (tham chiếu tới User).
 * @property {number} amount - Số tiền thanh toán.
 * @property {Date} payment_date - Thời điểm thanh toán (mặc định là thời gian hiện tại).
 */

/**
 * Schema lưu thông tin các giao dịch thanh toán của người dùng.
 * Có thể dùng cho các chức năng: đăng ký gói dịch vụ, nâng cấp tài khoản, v.v.
 */
const PaymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_date: {
        type: Date,
        default: Date.now
    }
}, { collection: 'payments' });

module.exports = mongoose.model('Payment', PaymentSchema);
