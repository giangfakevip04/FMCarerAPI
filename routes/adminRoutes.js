/**
 * @module AdminRouter
 * @description Express router for handling admin-related routes in the FMCarer system,
 * including authentication, dashboard, user management, post moderation, and statistics.
 * Requires middleware `requireAdmin` for authenticated routes and optional session/flash setup.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middlewares/requireAdmin');

/**
 * @note Ensure `express-session` and `connect-flash` are configured in main app.js or server.js:
 * @example
 * const session = require('express-session');
 * const flash = require('connect-flash');
 * app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
 * app.use(flash());
 */

/**
 * @route GET /admin/login
 * @desc Renders the admin login form.
 * @access Public
 * @middleware None
 * @controller adminController.showLoginForm
 */
router.get('/login', adminController.showLoginForm);

/**
 * @route POST /admin/login
 * @desc Handles admin login authentication.
 * @access Public
 * @middleware None
 * @controller adminController.handleLogin
 */
router.post('/login', adminController.handleLogin);

/**
 * @route POST /admin/logout
 * @desc Logs out the admin by clearing the token cookie.
 * @access Public (handled by controller logic)
 * @middleware None
 * @controller adminController.handleLogout
 */
router.post('/logout', adminController.handleLogout);

/**
 * @route GET /admin/dashboard
 * @desc Renders the admin dashboard with user statistics.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.dashboard
 */
router.get('/dashboard', requireAdmin, adminController.dashboard);

/**
 * @route GET /admin/users
 * @desc Retrieves and renders a list of parent and subuser accounts.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.getUserList
 */
router.get('/users', requireAdmin, adminController.getUserList);

/**
 * @route POST /admin/users/:id/toggle-suspension
 * @desc Toggles the suspension status of a user (except admins).
 * @access Private
 * @middleware requireAdmin
 * @param {string} id - The ID of the user to toggle suspension.
 * @controller adminController.toggleUserSuspension
 */
router.post('/users/:id/toggle-suspension', requireAdmin, adminController.toggleUserSuspension);

/**
 * @route GET /admin/statistics
 * @desc Retrieves and renders system statistics for the admin.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.getSystemStatistics
 */
router.get('/statistics', requireAdmin, adminController.getSystemStatistics);

/**
 * @route GET /admin/posts
 * @desc Retrieves all posts for admin moderation view.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.getAllPosts
 */
router.get('/posts', requireAdmin, adminController.getAllPosts);

/**
 * @route POST /admin/posts/create
 * @desc Creates a new post by an admin.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.createPost
 */
router.post('/posts/create', requireAdmin, adminController.createPost);

/**
 * @route POST /admin/posts/:postId/update
 * @desc Updates an existing post's content, media, visibility, or status.
 * @access Private
 * @middleware requireAdmin
 * @param {string} postId - The ID of the post to update.
 * @controller adminController.updatePost
 */
router.post('/posts/:postId/update', requireAdmin, adminController.updatePost);

/**
 * @route POST /admin/posts/:postId/approve
 * @desc Approves a post by changing its status to 'active'.
 * @access Private
 * @middleware requireAdmin
 * @param {string} postId - The ID of the post to approve.
 * @controller adminController.approvePost
 */
router.post('/posts/:postId/approve', requireAdmin, adminController.approvePost);

/**
 * @route POST /admin/posts/:postId/reject
 * @desc Rejects a post by changing its status to 'rejected' with a reason.
 * @access Private
 * @middleware requireAdmin
 * @param {string} postId - The ID of the post to reject.
 * @controller adminController.rejectPost
 */
router.post('/posts/:postId/reject', requireAdmin, adminController.rejectPost);

/**
 * @route POST /admin/posts/:postId/delete
 * @desc Deletes a specific post.
 * @access Private
 * @middleware requireAdmin
 * @param {string} postId - The ID of the post to delete.
 * @controller adminController.deletePost
 */
router.post('/posts/:postId/delete', requireAdmin, adminController.deletePost);

/**
 * @route POST /admin/posts/bulk-delete
 * @desc Deletes multiple posts in bulk based on provided IDs.
 * @access Private
 * @middleware requireAdmin
 * @controller adminController.bulkDeletePosts
 */
router.post('/posts/bulk-delete', requireAdmin, adminController.bulkDeletePosts);

/**
 * @route GET /admin/users/:id/details
 * @desc Retrieves and renders detailed information about a user.
 * @access Private
 * @middleware requireAdmin
 * @param {string} id - The ID of the user to retrieve details for.
 * @controller adminController.getUserDetails
 */
router.get('/users/:id/details', requireAdmin, adminController.getUserDetails);

module.exports = router;