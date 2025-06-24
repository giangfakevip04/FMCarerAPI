/**
 * Định nghĩa các endpoint quản lý lịch chăm sóc.
 * Base path: /api/schedules
 */

const express = require('express');
const router = express.Router();
const {
    createSchedule,
    getSchedulesByChild,
    updateSchedule,
    deleteSchedule
} = require('../controllers/scheduleController');

const { protect } = require('../middlewares/authMiddleware');

// Bảo vệ tất cả route
router.use(protect);

/**
 * @route POST /api/schedules
 * @desc Tạo lịch chăm sóc mới cho trẻ
 * @access Private
 */
router.post('/', createSchedule);

/**
 * @route GET /api/schedules/:childId
 * @desc Lấy danh sách lịch theo ID của trẻ
 * @access Private
 */
router.get('/:childId', getSchedulesByChild);

/**
 * @route PUT /api/schedules/:id
 * @desc Cập nhật lịch chăm sóc
 * @access Private
 */
router.put('/:id', updateSchedule);

/**
 * @route DELETE /api/schedules/:id
 * @desc Xoá lịch chăm sóc
 * @access Private
 */
router.delete('/:id', deleteSchedule);

module.exports = router;
