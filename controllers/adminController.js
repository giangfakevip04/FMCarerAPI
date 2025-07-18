/**
 * @module adminController
 * @description Controller handling administrative operations for the FMCarer system,
 * including authentication, dashboard, user management, post moderation, and system statistics.
 */

const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const Post = require('../models/Posts');
const Child = require('../models/Child');
const Reminder = require('../models/Reminder');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/token');
const logAdminAction = require('../middlewares/logger');

/**
 * @function showLoginForm
 * @description Renders the admin login form.
 * @route GET /admin/login
 * @access Public
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'login' EJS template with an optional error message.
 */
exports.showLoginForm = (req, res) => {
    res.render('login', { error: null });
};

/**
 * @function handleLogin
 * @description Handles admin login authentication.
 * @route POST /admin/login
 * @access Public
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with login data.
 * @param {string} req.body.email - The admin's email address.
 * @param {string} req.body.password - The admin's password (plaintext).
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/dashboard on success or renders 'login' with error on failure.
 * @throws {Error} - Throws an error if database query or authentication fails.
 */
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.render('login', {
                error: 'Vui lòng nhập đầy đủ email và mật khẩu.'
            });
        }

        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            console.log(`❌ Đăng nhập thất bại: Tài khoản '${email}' không tồn tại hoặc không phải admin.`);
            return res.render('login', {
                error: 'Tài khoản không tồn tại hoặc không có quyền truy cập.'
            });
        }

        if (user.isSuspended) {
            console.log(`❌ Đăng nhập admin thất bại: Tài khoản '${email}' đã bị đình chỉ.`);
            return res.render('login', {
                error: 'Tài khoản admin của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên cấp cao.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`❌ Đăng nhập thất bại: Mật khẩu không đúng cho tài khoản '${email}'.`);
            return res.render('login', { error: 'Mật khẩu không đúng.' });
        }

        const token = generateToken({
            _id: user._id,
            email: user.email,
            role: user.role,
            fullname: user.fullname,
            image: user.image
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        console.log(`✅ Admin ${user.email} đã đăng nhập thành công.`);

        await logAdminAction(user._id, `Admin ${user.email} đã đăng nhập.`);

        return res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('❌ Lỗi khi xử lý đăng nhập admin:', err.message);
        return res.status(500).render('login', {
            error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.'
        });
    }
};

/**
 * @function dashboard
 * @description Renders the admin dashboard with user statistics.
 * @route GET /admin/dashboard
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.user - The authenticated admin user (populated by auth middleware).
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'dashboard' EJS template with statistics.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.dashboard = async (req, res) => {
    try {
        const currentAdmin = req.user;

        const userCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        res.render('dashboard', {
            userCount,
            subuserCount,
            adminCount,
            admin: currentAdmin
        });
    } catch (error) {
        console.error('[AdminController] ❌ Dashboard Error:', error);
        res.status(500).send('Lỗi server khi hiển thị trang dashboard.');
    }
};

/**
 * @function getUserList
 * @description Retrieves and renders a list of parent and subuser accounts.
 * @route GET /admin/users
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.flash - Flash messages for user actions.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'users' EJS template with user list and counts.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.getUserList = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['parent', 'subuser'] } })
            .select('-password')
            .sort({ created_at: -1 })
            .lean();

        const parentCount = await User.countDocuments({ role: 'parent' });
        const subuserCount = await User.countDocuments({ role: 'subuser' });

        res.render('users', {
            users,
            parentCount,
            subuserCount,
            messages: req.flash()
        });
    } catch (error) {
        console.error('[AdminController] ❌ User List Error:', error);
        req.flash('error', 'Lỗi server khi hiển thị danh sách người dùng.');
        res.redirect('/admin/dashboard');
    }
};

/**
 * @function toggleUserSuspension
 * @description Toggles the suspension status of a user (except admins).
 * @route POST /admin/users/:id/toggle-suspend
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.id - The ID of the user to toggle suspension.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and new suspension status.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.toggleUserSuspension = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể thay đổi trạng thái của tài khoản admin thông qua đây.' });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();

        const actionDescription = user.isSuspended ? 'Đình chỉ' : 'Mở đình chỉ';
        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `${actionDescription} người dùng: ${user.fullname || user.email} (ID: ${user._id})`
            );
        } else {
            console.warn('⚠️ Could not log admin action: Admin user data missing from JWT.');
        }

        res.status(200).json({
            success: true,
            message: `${actionDescription} người dùng thành công!`,
            isSuspended: user.isSuspended
        });
    } catch (error) {
        console.error('[AdminController] ❌ Toggle Suspend Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thay đổi trạng thái người dùng.' });
    }
};

/**
 * @function handleLogout
 * @description Logs out the admin by clearing the token cookie.
 * @route GET /admin/logout
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to the login page after clearing the token cookie.
 */
exports.handleLogout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
};

/**
 * @function getSystemStatistics
 * @description Retrieves and renders system statistics for the admin.
 * @route GET /admin/statistics
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.flash - Flash messages for user actions.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'statistics' EJS template with statistics data.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.getSystemStatistics = async (req, res) => {
    try {
        const totalMainParents = await User.countDocuments({ role: 'parent' });
        const totalSubUsers = await User.countDocuments({ role: 'subuser' });
        const totalUsers = totalMainParents + totalSubUsers;

        const totalApprovedPosts = await Post.countDocuments({ status: 'active' });
        const totalPendingPosts = await Post.countDocuments({ status: 'pending' });
        const totalRejectedPosts = await Post.countDocuments({ status: 'rejected' });
        const totalPosts = await Post.countDocuments();

        const totalCompletedReminders = await Reminder.countDocuments({ is_completed: true });
        const totalUpcomingReminders = await Reminder.countDocuments({ is_completed: false, reminder_date: { $gte: new Date() } });
        const totalReminders = await Reminder.countDocuments();

        const totalChildrenManaged = await Child.countDocuments();

        res.render('statistics', {
            pageTitle: 'Thống kê Hệ thống',
            stats: {
                users: { mainParents: totalMainParents, subUsers: totalSubUsers, total: totalUsers },
                posts: { approved: totalApprovedPosts, pending: totalPendingPosts, rejected: totalRejectedPosts, total: totalPosts },
                reminders: { completed: totalCompletedReminders, upcoming: totalUpcomingReminders, total: totalReminders },
                children: { managed: totalChildrenManaged }
            },
            messages: req.flash()
        });
    } catch (error) {
        console.error('[AdminController] ❌ Get System Statistics Error:', error);
        req.flash('error', 'Lỗi server khi lấy thống kê hệ thống.');
        res.redirect('/admin/dashboard');
    }
};

/**
 * @function getChildrenByUser
 * @description Placeholder to retrieve children by user (not implemented).
 * @route GET /admin/children/user/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.getChildrenByUser = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function getChildById
 * @description Placeholder to retrieve a child by ID (not implemented).
 * @route GET /admin/children/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.getChildById = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function createChild
 * @description Placeholder to create a new child (not implemented).
 * @route POST /admin/children
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.createChild = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function updateChild
 * @description Placeholder to update a child (not implemented).
 * @route PUT /admin/children/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.updateChild = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function deleteChild
 * @description Placeholder to delete a child (not implemented).
 * @route DELETE /admin/children/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.deleteChild = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function createReminder
 * @description Placeholder to create a new reminder (not implemented).
 * @route POST /admin/reminders
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.createReminder = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function getRemindersByUser
 * @description Placeholder to retrieve reminders by user (not implemented).
 * @route GET /admin/reminders/user/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.getRemindersByUser = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function getReminderById
 * @description Placeholder to retrieve a reminder by ID (not implemented).
 * @route GET /admin/reminders/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.getReminderById = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function getRemindersByChild
 * @description Placeholder to retrieve reminders by child (not implemented).
 * @route GET /admin/reminders/child/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.getRemindersByChild = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function updateReminder
 * @description Placeholder to update a reminder (not implemented).
 * @route PUT /admin/reminders/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.updateReminder = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function deleteReminder
 * @description Placeholder to delete a reminder (not implemented).
 * @route DELETE /admin/reminders/:id
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.deleteReminder = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function completeReminder
 * @description Placeholder to mark a reminder as completed (not implemented).
 * @route PUT /admin/reminders/:id/complete
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Returns a 501 status indicating not implemented.
 */
exports.completeReminder = async (req, res) => {
    res.status(501).send('Not Implemented Yet');
};

/**
 * @function getAllPosts
 * @description Retrieves all posts for admin moderation view.
 * @route GET /admin/posts
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.flash - Flash messages for user actions.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'posts' EJS template with populated posts.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('id_user', 'fullname username email avatar_url image')
            .sort({ created_at: -1 })
            .lean();

        const populatedPosts = posts.map(post => {
            if (post.id_user) {
                post.user = {
                    _id: post.id_user._id,
                    fullname: post.id_user.fullname || post.id_user.username || post.id_user.email || 'Ẩn danh',
                    image: post.id_user.avatar_url || post.id_user.image || ''
                };
                post.fullname = post.user.fullname;
                post.image = post.user.image;
            } else {
                post.user = null;
                post.fullname = 'Ẩn danh';
                post.image = '';
            }
            delete post.id_user;
            return post;
        });

        res.render('posts', {
            pageTitle: 'Quản lý Bài viết',
            posts: populatedPosts,
            messages: req.flash()
        });
    } catch (error) {
        console.error('[AdminController] ❌ Error getAllPosts for Admin:', error);
        req.flash('error', 'Đã xảy ra lỗi khi tải danh sách bài viết để quản lý.');
        res.redirect('/admin/dashboard');
    }
};

/**
 * @function createPost
 * @description Creates a new post by an admin.
 * @route POST /admin/posts
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with post data.
 * @param {string} req.body.userId - The ID of the user (should match req.user._id).
 * @param {string} req.body.content - The post content.
 * @param {string} [req.body.selectedVisibility] - The post visibility (default: 'public').
 * @param {string[]} [req.body.mediaUrls] - Array of media URLs.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or error flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.createPost = async (req, res) => {
    try {
        const { userId, content, selectedVisibility, mediaUrls } = req.body;

        const adminUserId = req.user._id;
        const adminUser = await User.findById(adminUserId);

        if (!adminUser || adminUser.role !== 'admin') {
            req.flash('error', 'Chỉ tài khoản admin mới có thể tạo bài viết.');
            return res.redirect('/admin/posts');
        }

        const postFullname = adminUser.fullname || 'Admin';
        const postImage = adminUser.avatar_url || adminUser.image || '';

        const newPost = new Post({
            id_user: adminUserId,
            content: content,
            media_urls: mediaUrls,
            visibility: selectedVisibility || 'public',
            status: 'active'
        });

        await newPost.save();
        await logAdminAction(adminUserId, `Admin ${adminUser.email} đã tạo bài viết mới (ID: ${newPost._id}).`);

        req.flash('success', 'Bài viết đã được tạo thành công.');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error creating post (Admin):', error);
        req.flash('error', 'Đã xảy ra lỗi khi tạo bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function updatePost
 * @description Updates an existing post's content, media, visibility, or status.
 * @route PUT /admin/posts/:postId
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.postId - The ID of the post to update.
 * @param {Object} req.body - The request body with update data.
 * @param {string} [req.body.content] - The updated content.
 * @param {string[]} [req.body.media_urls] - The updated media URLs.
 * @param {string} [req.body.visibility] - The updated visibility.
 * @param {string} [req.body.status] - The updated status.
 * @param {string} [req.body.rejectionReason] - The reason for rejection (if status is 'rejected').
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or error flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, media_urls, visibility, status, rejectionReason } = req.body;

        const updateFields = { updated_at: Date.now() };
        if (content !== undefined) updateFields.content = content;
        if (media_urls !== undefined) updateFields.media_urls = media_urls;
        if (visibility !== undefined) updateFields.visibility = visibility;
        if (status !== undefined) updateFields.status = status;
        if (status === 'rejected') {
            updateFields.rejectionReason = rejectionReason || 'Không có lý do cụ thể.';
        } else {
            updateFields.rejectionReason = undefined;
        }

        const updated = await Post.findByIdAndUpdate(
            postId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updated) {
            req.flash('error', 'Không tìm thấy bài viết để cập nhật.');
            return res.redirect('/admin/posts');
        }

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Cập nhật bài viết (ID: ${postId}, Trạng thái: ${status || updated.status}, Lý do từ chối: ${rejectionReason || 'Không có'})`
            );
        }

        req.flash('success', 'Bài viết đã được cập nhật thành công.');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error updatePost:', error);
        req.flash('error', 'Lỗi server khi cập nhật bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function deletePost
 * @description Deletes a specific post.
 * @route DELETE /admin/posts/:postId
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.postId - The ID of the post to delete.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or error flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const deleted = await Post.findByIdAndDelete(postId);
        if (!deleted) {
            req.flash('error', 'Không tìm thấy bài viết để xóa.');
            return res.redirect('/admin/posts');
        }

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Xóa bài viết (ID: ${postId}, Nội dung: '${deleted.content ? deleted.content.substring(0, 50) + '...' : 'Không có nội dung'}')`
            );
        }

        req.flash('success', 'Bài viết đã được xóa thành công.');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error deletePost:', error);
        req.flash('error', 'Lỗi server khi xóa bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function approvePost
 * @description Approves a post by changing its status to 'active'.
 * @route POST /admin/posts/:postId/approve
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.postId - The ID of the post to approve.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or info flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.approvePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);

        if (!post) {
            req.flash('error', 'Không tìm thấy bài viết để duyệt.');
            return res.redirect('/admin/posts');
        }

        if (post.status === 'active') {
            req.flash('info', 'Bài viết đã được duyệt rồi.');
            return res.redirect('/admin/posts');
        }

        post.status = 'active';
        post.rejectionReason = undefined;
        await post.save();

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Duyệt bài viết: ${post.content ? post.content.substring(0, 50) + '...' : 'Không có nội dung'} (ID: ${postId})`
            );
        }

        req.flash('success', 'Bài viết đã được duyệt thành công!');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error approving post:', error);
        req.flash('error', 'Lỗi server khi duyệt bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function rejectPost
 * @description Rejects a post by changing its status to 'rejected' with a reason.
 * @route POST /admin/posts/:postId/reject
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.postId - The ID of the post to reject.
 * @param {Object} req.body - The request body with rejection data.
 * @param {string} [req.body.rejectionReason] - The reason for rejection.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or info flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.rejectPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { rejectionReason } = req.body;
        const post = await Post.findById(postId);

        if (!post) {
            req.flash('error', 'Không tìm thấy bài viết để từ chối.');
            return res.redirect('/admin/posts');
        }

        if (post.status === 'rejected') {
            req.flash('info', 'Bài viết đã bị từ chối rồi.');
            return res.redirect('/admin/posts');
        }

        post.status = 'rejected';
        post.rejectionReason = rejectionReason || 'Không có lý do cụ thể.';
        await post.save();

        if (req.user && req.user._id) {
            await logAdminAction(
                req.user._id,
                `Từ chối bài viết: ${post.content ? post.content.substring(0, 50) + '...' : 'Không có nội dung'} (ID: ${postId}). Lý do: ${rejectionReason || 'Không có'}`
            );
        }

        req.flash('success', 'Bài viết đã được từ chối thành công!');
        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error rejecting post:', error);
        req.flash('error', 'Lỗi server khi từ chối bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function bulkDeletePosts
 * @description Deletes multiple posts in bulk based on provided IDs.
 * @route POST /admin/posts/bulk-delete
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with post IDs.
 * @param {string} req.body.postIdsToDelete - JSON string of post IDs to delete.
 * @param {Object} req.user - The authenticated admin user.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Redirects to /admin/posts with a success or info flash message.
 * @throws {Error} - Throws an error if database operation fails.
 */
exports.bulkDeletePosts = async (req, res) => {
    try {
        const postIdsToDeleteString = req.body.postIdsToDelete;

        let postIds;
        try {
            postIds = JSON.parse(postIdsToDeleteString);
        } catch (parseError) {
            req.flash('error', 'Dữ liệu ID bài viết không hợp lệ.');
            console.error('❌ Lỗi parse JSON khi xóa hàng loạt:', parseError);
            return res.redirect('/admin/posts');
        }

        if (!Array.isArray(postIds) || postIds.length === 0) {
            req.flash('info', 'Không có bài viết nào được chọn để xóa.');
            return res.redirect('/admin/posts');
        }

        const deleteResult = await Post.deleteMany({ _id: { $in: postIds } });

        if (deleteResult.deletedCount > 0) {
            if (req.user && req.user._id) {
                await logAdminAction(
                    req.user._id,
                    `Đã xóa hàng loạt ${deleteResult.deletedCount} bài viết. ID: [${postIds.join(', ')}]`
                );
            }
            req.flash('success', `Đã xóa thành công ${deleteResult.deletedCount} bài viết.`);
        } else {
            req.flash('info', 'Không tìm thấy bài viết nào để xóa trong danh sách đã chọn.');
        }

        res.redirect('/admin/posts');
    } catch (error) {
        console.error('[AdminController] ❌ Error bulkDeletePosts:', error);
        req.flash('error', 'Lỗi server khi xóa hàng loạt bài viết: ' + error.message);
        res.redirect('/admin/posts');
    }
};

/**
 * @function getUserDetails
 * @description Retrieves and renders detailed information about a user, including subusers, children, reminders, and posts.
 * @route GET /admin/users/:id/details
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.id - The ID of the user to retrieve details for.
 * @param {Object} res - The HTTP response object.
 * @returns {void} - Renders the 'user-details' EJS template with user details.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).send('Người dùng không tồn tại');
        }

        const subUsers = await User.find({ created_by: userId }).lean();
        const children = await Child.find({ user_id: userId }).lean();

        const childIds = children.map(child => child._id);
        const reminders = await Reminder.find({
            $or: [
                { user_id: userId },
                { child_id: { $in: childIds } }
            ]
        }).lean();

        const posts = await Post.find({ id_user: userId }).lean();

        res.render('user-details', {
            pageTitle: `Chi tiết người dùng - ${user.fullname || user.email}`,
            user,
            subUsers,
            children,
            reminders,
            posts
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy chi tiết người dùng:', err);
        res.status(500).json({
            status: 500,
            message: 'Lỗi máy chủ khi lấy chi tiết người dùng',
            error: err
        });
    }
};

module.exports = exports;