/**
 * Định nghĩa các endpoint quản lý thông tin trẻ em.
 * Base path: /api/children
 */

const express = require('express');
const router = express.Router();
const {
    addChild,
    getChildren,
    updateChild,
    deleteChild
} = require('../controllers/childController');

const { protect } = require('../middlewares/authMiddleware');

// Bắt buộc phải đăng nhập với mọi route
router.use(protect);

/**
 * @route POST /api/children
 * @desc Thêm thông tin trẻ mới
 * @access Private
 */
router.post('/', addChild);

/**
 * @route GET /api/children
 * @desc Lấy danh sách trẻ thuộc user hiện tại
 * @access Private
 */
router.get('/', getChildren);

/**
 * @route PUT /api/children/:id
 * @desc Cập nhật thông tin trẻ
 * @access Private
 */
router.put('/:id', updateChild);

/**
 * @route DELETE /api/children/:id
 * @desc Xoá trẻ theo ID
 * @access Private
 */
router.delete('/:id', deleteChild);

module.exports = router;
