/**
 * Route quản lý khiếu nại hệ thống.
 * Base path: /api/complaints
 */

const express = require('express');
const router = express.Router();
const {
    sendComplaint,
    getAllComplaints,
    replyComplaint,
    deleteComplaint
} = require('../controllers/complaintController');

const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route POST /api/complaints
 * @desc Người dùng gửi khiếu nại
 * @access Private
 */
router.post('/', sendComplaint);

/**
 * @route GET /api/complaints
 * @desc Admin lấy danh sách khiếu nại
 * @access Private (admin)
 */
router.get('/', restrictTo('admin'), getAllComplaints);

/**
 * @route PUT /api/complaints/:id/reply
 * @desc Admin phản hồi khiếu nại
 * @access Private (admin)
 */
router.put('/:id/reply', restrictTo('admin'), replyComplaint);

/**
 * @route DELETE /api/complaints/:id
 * @desc Admin xoá khiếu nại
 * @access Private (admin)
 */
router.delete('/:id', restrictTo('admin'), deleteComplaint);

module.exports = router;
