/**
 * Controller quản lý khiếu nại (Complaint) từ người dùng.
 */

const Complaint = require('../models/Complaint');

/**
 * Người dùng gửi khiếu nại.
 */
exports.sendComplaint = async (req, res) => {
    try {
        const { message } = req.body;
        const complaint = await Complaint.create({
            userId: req.user.id,
            message
        });
        res.status(201).json(complaint);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi gửi khiếu nại', error: err.message });
    }
};

/**
 * Admin: lấy danh sách tất cả khiếu nại.
 */
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy khiếu nại', error: err.message });
    }
};

/**
 * Admin phản hồi một khiếu nại.
 */
exports.replyComplaint = async (req, res) => {
    try {
        const { reply } = req.body;
        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            { reply, status: 'resolved' },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy khiếu nại' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi phản hồi khiếu nại', error: err.message });
    }
};

/**
 * Admin xoá khiếu nại.
 */
exports.deleteComplaint = async (req, res) => {
    try {
        const deleted = await Complaint.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy khiếu nại để xoá' });
        res.json({ message: 'Đã xoá khiếu nại thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá khiếu nại', error: err.message });
    }
};
