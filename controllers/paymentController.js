/**
 * Controller xử lý ghi nhận và truy xuất giao dịch thanh toán.
 */

const Payment = require('../models/Payment');

/**
 * Ghi nhận thanh toán mới từ người dùng.
 *
 * @param {Object} req - body: amount
 * @param {Object} res - trả về payment đã ghi
 */
exports.createPayment = async (req, res) => {
    try {
        const { amount } = req.body;
        const payment = await Payment.create({
            userId: req.user.id,
            amount
        });
        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi tạo giao dịch', error: err.message });
    }
};

/**
 * Lấy danh sách thanh toán của người dùng hiện tại.
 */
exports.getUserPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy lịch sử thanh toán', error: err.message });
    }
};

/**
 * Admin: Lấy tất cả thanh toán từ tất cả người dùng.
 */
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy tất cả thanh toán', error: err.message });
    }
};

/**
 * Admin: Xoá giao dịch thanh toán.
 */
exports.deletePayment = async (req, res) => {
    try {
        const deleted = await Payment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy giao dịch để xoá' });
        res.json({ message: 'Đã xoá giao dịch thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá giao dịch', error: err.message });
    }
};
