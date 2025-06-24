/**
 * Route quản lý thông báo hệ thống.
 * Base path: /api/notifications
 */

const express = require('express');
const router = express.Router();
const {
    sendNotification,
    getNotifications,
    markAsRead,
    deleteNotification
} = require('../controllers/notificationController');

const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route POST /api/notifications
 * @desc Gửi thông báo đến người dùng
 * @access Private
 */
router.post('/', sendNotification);

/**
 * @route GET /api/notifications/:userId
 * @desc Lấy tất cả thông báo của người dùng
 * @access Private
 */
router.get('/:userId', getNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Đánh dấu đã đọc
 * @access Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Xoá thông báo
 * @access Private
 */
router.delete('/:id', deleteNotification);

module.exports = router;
