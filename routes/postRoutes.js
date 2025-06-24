/**
 * Route quản lý bài viết chia sẻ.
 * Base path: /api/posts
 */

const express = require('express');
const router = express.Router();
const {
    createPost,
    getAllPosts,
    updatePost,
    deletePost,
    approvePost
} = require('../controllers/postController');

const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @route POST /api/posts
 * @desc Tạo bài viết mới
 * @access Private
 */
router.post('/', createPost);

/**
 * @route GET /api/posts
 * @desc Lấy danh sách bài viết (công khai hoặc nội bộ)
 * @access Private
 */
router.get('/', getAllPosts);

/**
 * @route PUT /api/posts/:id
 * @desc Cập nhật bài viết
 * @access Private (chỉ người tạo)
 */
router.put('/:id', updatePost);

/**
 * @route PUT /api/posts/:id/approve
 * @desc Duyệt bài viết
 * @access Private (admin)
 */
router.put('/:id/approve', restrictTo('admin'), approvePost);

/**
 * @route DELETE /api/posts/:id
 * @desc Xoá bài viết
 * @access Private (chủ sở hữu hoặc admin)
 */
router.delete('/:id', deletePost);

module.exports = router;
