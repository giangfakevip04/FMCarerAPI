/**
 * Controller xử lý thông báo hệ thống.
 */

const Notification = require('../models/Notification');

/**
 * Gửi thông báo mới đến người dùng.
 *
 * @param {Object} req - body gồm userId, message, type
 * @param {Object} res - trả về thông báo đã gửi
 */
exports.sendNotification = async (req, res) => {
    try {
        const { userId, message, type } = req.body;
        const noti = await Notification.create({ userId, message, type });
        res.status(201).json(noti);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi gửi thông báo', error: err.message });
    }
};

/**
 * Lấy tất cả thông báo của một người dùng.
 */
exports.getNotifications = async (req, res) => {
    try {
        const notis = await Notification.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(notis);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: err.message });
    }
};

/**
 * Đánh dấu thông báo là đã đọc.
 */
exports.markAsRead = async (req, res) => {
    try {
        const updated = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: err.message });
    }
};

/**
 * Xoá một thông báo.
 */
exports.deleteNotification = async (req, res) => {
    try {
        const deleted = await Notification.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy thông báo để xoá' });
        res.json({ message: 'Đã xoá thông báo thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá thông báo', error: err.message });
    }
};
