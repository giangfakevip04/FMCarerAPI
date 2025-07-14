/**
 * @file routes/usersRoutes.js
 * @description Định tuyến các API liên quan đến người dùng (parent và subuser).
 * Base path: /api/users
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const upload = require('../middlewares/upload');

/**
 * @route GET /api/users/users
 * @description Lấy danh sách toàn bộ người dùng (ẩn mật khẩu)
 */
router.get('/users', userController.getAllUsers);

/**
 * @route POST /api/users/register
 * @description Đăng ký tài khoản chính (parent)
 */
router.post('/register', userController.registerParent);

/**
 * @route POST /api/users/login
 * @description Đăng nhập tài khoản chính (parent)
 */
router.post('/login', userController.loginParent);

/**
 * @route POST /api/users/update
 * @description Cập nhật thông tin người dùng (fullname, số điện thoại, ảnh...)
 */
router.post('/update', userController.updateUser);

/**
 * @route POST /api/users/upload-avatar
 * @description Upload ảnh đại diện cho người dùng (dạng multipart)
 */
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

/**
 * @route GET /api/users/subusers/parent/:parentId
 * @description Lấy danh sách tất cả subuser của một parent
 */
router.get('/subusers/parent/:parentId', userController.getAllSubusersByParentId);

/**
 * @route GET /api/users/subuser/:subuserId
 * @description Lấy thông tin chi tiết của một subuser
 */
router.get('/subuser/:subuserId', userController.getSubuserById);

/**
 * @route POST /api/users/subuser/create-or-update
 * @description Tạo mới hoặc cập nhật subuser dựa theo số điện thoại
 */
router.post('/subuser/create-or-update', userController.createOrUpdateSubuser);

/**
 * @route DELETE /api/users/subuser/:subuserId
 * @description Xóa một subuser
 */
router.delete('/subuser/:subuserId', userController.deleteSubuser);

/**
 * @route POST /api/users/login-subuser
 * @description Đăng nhập bằng tài khoản phụ (subuser)
 */
router.post('/login-subuser', userController.loginSubuser);

module.exports = router;
