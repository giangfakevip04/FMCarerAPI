const express = require('express');
const router = express.Router();
const { getProfile, createSubUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.get('/profile', protect, getProfile); // ai đăng nhập cũng gọi được
router.post('/sub', protect, restrictTo('main'), createSubUser); // chỉ tài khoản chính mới gọi được

module.exports = router;
