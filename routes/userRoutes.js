/**
 * Định nghĩa các endpoint quản lý người dùng.
 * Base path: /api/users
 */

const express = require('express');
const router = express.Router();
const { getProfile, createSubUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/users/profile
 * @desc Lấy thông tin người dùng hiện tại
 * @access Private (yêu cầu đã đăng nhập)
 */
router.get('/profile', protect, getProfile);

/**
 * @route POST /api/users/sub
 * @desc Tài khoản chính tạo tài khoản phụ
 * @access Private (chỉ tài khoản chính)
 */
router.post('/sub', protect, restrictTo('main'), createSubUser);

module.exports = router;
