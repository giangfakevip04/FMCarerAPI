/**
 * Định nghĩa route quản lý nhật ký chăm sóc (logs).
 * Base path: /api/logs
 */

const express = require('express');
const router = express.Router();
const {
    createLog,
    getLogsByChild,
    getLogsBySchedule,
    updateLog,
    deleteLog
} = require('../controllers/logController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route POST /api/logs
 * @desc Tạo nhật ký chăm sóc mới
 * @access Private
 */
router.post('/', createLog);

/**
 * @route GET /api/logs/:childId
 * @desc Lấy nhật ký theo trẻ
 * @access Private
 */
router.get('/:childId', getLogsByChild);

/**
 * @route GET /api/logs/by-schedule/:scheduleId
 * @desc Lấy nhật ký theo lịch
 * @access Private
 */
router.get('/by-schedule/:scheduleId', getLogsBySchedule);

/**
 * @route PUT /api/logs/:id
 * @desc Cập nhật log
 * @access Private
 */
router.put('/:id', updateLog);

/**
 * @route DELETE /api/logs/:id
 * @desc Xoá log
 * @access Private
 */
router.delete('/:id', deleteLog);

module.exports = router;
