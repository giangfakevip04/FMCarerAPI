/**
 * @file paymentRoutes.js
 * @description Định nghĩa các route liên quan đến chức năng thanh toán (Momo)
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * Middleware xác thực đơn giản (mô phỏng).
 * Trong thực tế, nên thay thế bằng middleware xác thực JWT hoặc session thật.
 *
 * @function
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
const authMiddleware = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }
    // Gán giả thông tin người dùng vào req
    req.user = { _id: '66976865a77478051752b12f', username: 'testuser' };
    next();
};

// ===============================
// ========== ROUTES =============
// ===============================

/**
 * @route POST /api/payments/topup/initiate
 * @description Khởi tạo yêu cầu nạp tiền (hỗ trợ Momo)
 * @access Private
 */
router.post('/topup/initiate', authMiddleware, paymentController.initiateTopUp);

/**
 * @route POST /api/payments/momo-ipn
 * @description Nhận thông báo IPN từ Momo sau khi thanh toán
 * @access Public (do Momo gọi)
 */
router.post('/momo-ipn', paymentController.momoIPN);

/**
 * @route GET /api/payments/topup/history
 * @description Lấy danh sách các giao dịch nạp tiền của người dùng hiện tại
 * @access Private
 */
router.get('/topup/history', authMiddleware, paymentController.getTopUpHistory);

/**
 * @route GET /api/payments/topup/:id
 * @description Lấy chi tiết một giao dịch nạp tiền theo ID
 * @access Private
 */
router.get('/topup/:id', authMiddleware, paymentController.getPaymentById);

// --- Loại bỏ callback của ZaloPay nếu không dùng ---
// router.post('/zalopay-callback', paymentController.zalopayCallback);

module.exports = router;
