/**
 * Định tuyến xử lý "nhật ký chăm sóc" (logs), kết nối với reminderController.
 * Base path: /api/logs
 */

const express = require('express');
const router = express.Router();
const {
    createReminder,
    getRemindersByChild,
    getReminderById,
    updateReminder,
    deleteReminder
} = require('../controllers/reminderController');
const { requireAuth } = require('../middlewares/auth');

// Áp dụng middleware bảo vệ
router.use(requireAuth);

/**
 * @route POST /api/logs
 * @desc Tạo nhật ký chăm sóc mới
 * @access Private
 */
router.post('/', createReminder);

/**
 * @route GET /api/logs/:childId
 * @desc Lấy nhật ký theo ID trẻ
 * @access Private
 */
router.get('/:childId', getReminderById);

/**
 * @route GET /api/logs/by-schedule/:scheduleId
 * @desc Lấy nhật ký theo lịch nhắc nhở
 * @access Private
 */
router.get('/by-schedule/:scheduleId', getReminderById);

/**
 * @route PUT /api/logs/:id
 * @desc Cập nhật nhật ký chăm sóc
 * @access Private
 */
router.put('/:id', updateReminder);

/**
 * @route DELETE /api/logs/:id
 * @desc Xóa nhật ký chăm sóc
 * @access Private
 */
router.delete('/:id', deleteReminder);

module.exports = router;
