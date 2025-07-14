/**
 * Định tuyến xử lý bài viết người dùng (giống mạng xã hội mini).
 * Base path: /api/posts
 */

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth } = require('../middlewares/auth');

/**
 * @route GET /api/posts
 * @desc Lấy tất cả bài viết (không cần xác thực)
 * @access Public
 */
router.get('/', postController.getAllPosts);

/**
 * @route POST /api/posts
 * @desc Tạo bài viết mới
 * @access Private
 */
router.post('/', requireAuth, postController.createPost);

/**
 * @route PUT /api/posts/:postId
 * @desc Cập nhật bài viết
 * @access Private
 */
router.put('/:postId', requireAuth, postController.updatePost);

/**
 * @route DELETE /api/posts/:postId
 * @desc Xoá bài viết
 * @access Private
 */
router.delete('/:postId', requireAuth, postController.deletePost);

module.exports = router;
