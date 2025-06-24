/**
 * Controller quản lý bài viết (Post).
 * Người dùng tạo bài viết; admin có thể duyệt hoặc xoá.
 */

const Post = require('../models/Post');

/**
 * Tạo bài viết mới.
 */
exports.createPost = async (req, res) => {
    try {
        const { content, level } = req.body;
        const post = await Post.create({
            content,
            level,
            createdBy: req.user.id
        });
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tạo bài viết', error: err.message });
    }
};

/**
 * Lấy tất cả bài viết (lọc theo level nếu có).
 */
exports.getAllPosts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.level) {
            filter.level = req.query.level;
            filter.status = 'approved';
        }
        const posts = await Post.find(filter)
            .populate('createdBy', 'email role')
            .populate('approvedBy', 'email role')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bài viết', error: err.message });
    }
};

/**
 * Cập nhật bài viết (chỉ chủ sở hữu được sửa).
 */
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.id },
            req.body,
            { new: true }
        );
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật bài viết', error: err.message });
    }
};

/**
 * Duyệt bài viết (chỉ admin).
 */
exports.approvePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { status: 'approved', approvedBy: req.user.id },
            { new: true }
        );
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài để duyệt' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi duyệt bài viết', error: err.message });
    }
};

/**
 * Xoá bài viết.
 */
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài để xoá' });

        const isOwner = post.createdBy.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Không có quyền xoá bài viết này' });
        }

        await post.remove();
        res.json({ message: 'Đã xoá bài viết thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xoá bài viết', error: err.message });
    }
};
