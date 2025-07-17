const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const upload = require('../middlewares/upload'); // Đảm bảo đường dẫn này đúng

// --- Routes chung cho người dùng --- //

/**
 * @desc Lấy danh sách tất cả người dùng trong hệ thống (parent và subuser).
 * @route GET /api/users/users
 * @access Public (có thể cần auth trong môi trường production)
 */
router.get('/users', userController.getAllUsers);

/**
 * @desc Đăng ký tài khoản Parent mới.
 * @route POST /api/users/register
 * @access Public
 */
router.post('/register', userController.registerParent);

/**
 * @desc Đăng nhập tài khoản Parent.
 * @route POST /api/users/login
 * @access Public
 */
router.post('/login', userController.loginParent);

/**
 * @desc Cập nhật thông tin người dùng (Parent hoặc Subuser).
 * @route POST /api/users/update
 * @access Private (cần xác thực)
 */
router.post('/update', userController.updateUser);

/**
 * @desc Upload ảnh đại diện cho người dùng.
 * @route POST /api/users/upload-avatar
 * @access Private (cần xác thực)
 */
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);

// --- Routes cho tài khoản phụ (Subuser) --- //

/**
 * @desc Lấy danh sách tất cả subuser của một Parent cụ thể.
 * @route GET /api/users/subusers/parent/:parentId
 * @access Private (chỉ parent hoặc admin)
 */
router.get('/subusers/parent/:parentId', userController.getAllSubusersByParentId);

/**
 * @desc Lấy thông tin một subuser cụ thể theo ID.
 * @route GET /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser hoặc admin)
 */
router.get('/subuser/:subuserId', userController.getSubuserById);

/**
 * @desc Tạo mới hoặc cập nhật thông tin subuser.
 * @route POST /api/users/subuser/create-or-update
 * @access Private (chỉ parent)
 */
router.post('/subuser/create-or-update', userController.createOrUpdateSubuser);

/**
 * @desc Xóa một subuser cụ thể.
 * @route DELETE /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser hoặc admin)
 */
router.delete('/subuser/:subuserId', userController.deleteSubuser);

/**
 * @desc Đăng nhập tài khoản Subuser.
 * @route POST /api/users/login-subuser
 * @access Public
 */
router.post('/login-subuser', userController.loginSubuser);

/**
 * @desc Kiểm tra trạng thái hoạt động của userRouter.
 * @route GET /api/users
 * @access Public
 */
router.get('/', (req, res) => {
    res.send('🟢 userRouter hoạt động!');
});

/**
 * @desc Xác thực mật khẩu của người dùng.
 * @route POST /api/users/verify-password
 * @access Private
 */
router.post('/verify-password', userController.verifyPassword);

module.exports = router;