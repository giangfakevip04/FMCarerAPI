/**
 * Định tuyến cho tính năng nhắc nhở chăm sóc trẻ.
 * Base path: /api/reminders
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminderController');
const { requireAuth } = require('../middlewares/auth');

/**
 * @route POST /api/reminders
 * @desc Tạo nhắc nhở mới
 * @access Private
 */
router.post('/', requireAuth, controller.createReminder);

/**
 * @route GET /api/reminders
 * @desc Lấy danh sách tất cả nhắc nhở của người dùng
 * @access Private
 */
router.get('/', requireAuth, controller.getRemindersByUser);

/**
 * @route GET /api/reminders/:id
 * @desc Lấy nhắc nhở theo ID
 * @access Private
 */
router.get('/:id', requireAuth, controller.getReminderById);

/**
 * @route GET /api/reminders/by-child/:childId
 * @desc Lấy nhắc nhở theo trẻ
 * @access Private
 */
router.get('/by-child/:childId', requireAuth, controller.getRemindersByChild);

/**
 * @route PUT /api/reminders/:id
 * @desc Cập nhật nhắc nhở
 * @access Private
 */
router.put('/:id', requireAuth, controller.updateReminder);

/**
 * @route DELETE /api/reminders/:id
 * @desc Xoá nhắc nhở
 * @access Private
 */
router.delete('/:id', requireAuth, controller.deleteReminder);

/**
 * @route PUT /api/reminders/:id/complete
 * @desc Đánh dấu nhắc nhở là đã hoàn thành
 * @access Private
 */
router.put('/:id/complete', requireAuth, controller.completeReminder);

module.exports = router;
