const Post = require('../models/Posts');
const User = require('../models/User');

/**
 * Lấy toàn bộ danh sách bài viết trong hệ thống.
 * Mỗi bài viết sẽ được bổ sung thêm thông tin người đăng gồm: họ tên và ảnh đại diện.
 * Ưu tiên `avatar_url`, nếu không có thì dùng `image`, nếu cả hai đều không có thì để rỗng.
 *
 * @route GET /api/posts
 * @access Công khai
 */
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ created_at: -1 }).lean();

        const populatedPosts = await Promise.all(
            posts.map(async (post) => {
                const user = await User.findById(post.id_user).lean();
                if (user) {
                    post.fullname = user.fullname;
                    post.image = user.avatar_url || user.image || '';
                } else {
                    post.fullname = 'Ẩn danh';
                    post.image = '';
                }
                return post;
            })
        );

        res.status(200).json(populatedPosts);

    } catch (error) {
        console.error('Error getAllPosts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

/**
 * Tạo mới một bài viết.
 * Nội dung bài viết có thể gồm văn bản và danh sách đường dẫn hình ảnh.
 * Thêm snapshot của người đăng gồm: fullname và avatar vào bài viết.
 *
 * @route POST /api/posts
 * @access Công khai
 */
exports.createPost = async (req, res) => {
    try {
        const { userId, content, selectedVisibility, mediaUrls } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const postFullname = user.fullname || 'Ẩn danh';
        const postImage = user.avatar_url || user.image || '';

        const newPost = new Post({
            id_user: userId,
            fullname: postFullname,
            image: postImage,
            content: content,
            media_urls: mediaUrls,
            visibility: selectedVisibility,
            status: 'active'
        });

        const savedPost = await newPost.save();
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post: savedPost
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

/**
 * Cập nhật nội dung một bài viết theo ID.
 * Cho phép sửa nội dung, ảnh, trạng thái và chế độ hiển thị.
 *
 * @route PUT /api/posts/:postId
 * @access Công khai
 */
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, media_urls, visibility, status } = req.body;

        const updated = await Post.findByIdAndUpdate(
            postId,
            {
                content,
                media_urls,
                visibility,
                status,
                updated_at: Date.now()
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updated
        });
    } catch (error) {
        console.error('Error updatePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

/**
 * Xoá một bài viết theo ID.
 *
 * @route DELETE /api/posts/:postId
 * @access Công khai
 */
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deletePost:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

module.exports = exports;
