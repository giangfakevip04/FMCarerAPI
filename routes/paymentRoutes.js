/**
 * Route quản lý thanh toán (Payment)
 * Base path: /api/payments
 */

const express = require('express');
const router = express.Router();
const {
    createPayment,
    getUserPayments,
    getAllPayments,
    deletePayment
} = require('../controllers/paymentController');

const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route POST /api/payments
 * @desc Ghi nhận thanh toán mới (người dùng)
 * @access Private
 */
router.post('/', createPayment);

/**
 * @route GET /api/payments
 * @desc Lấy thanh toán của chính mình
 * @access Private
 */
router.get('/', getUserPayments);

/**
 * @route GET /api/payments/all
 * @desc Admin lấy tất cả giao dịch
 * @access Private (admin)
 */
router.get('/all', restrictTo('admin'), getAllPayments);

/**
 * @route DELETE /api/payments/:id
 * @desc Admin xoá giao dịch
 * @access Private (admin)
 */
router.delete('/:id', restrictTo('admin'), deletePayment);

module.exports = router;
