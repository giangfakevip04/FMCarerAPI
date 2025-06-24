/**
 * Controller xử lý ghi nhận và quản lý nhật ký chăm sóc (logs).
 */

const Log = require('../models/Log');

/**
 * Ghi nhận một nhật ký chăm sóc mới.
 *
 * @param {Object} req - body gồm childId, activity, note (optional), scheduleId (optional)
 * @param {Object} res - trả về log đã ghi
 */
exports.createLog = async (req, res) => {
    try {
        const { childId, activity, note, scheduleId } = req.body;
        const log = await Log.create({
            childId,
            scheduleId,
            activity,
            note,
            performedBy: req.user.id
        });
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi ghi nhận nhật ký', error: err.message });
    }
};

/**
 * Lấy tất cả log của một trẻ theo ID.
 */
exports.getLogsByChild = async (req, res) => {
    try {
        const logs = await Log.find({ childId: req.params.childId })
            .populate('performedBy', 'email role')
            .sort({ performedAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy nhật ký', error: err.message });
    }
};

/**
 * Lấy tất cả log theo schedule ID.
 */
exports.getLogsBySchedule = async (req, res) => {
    try {
        const logs = await Log.find({ scheduleId: req.params.scheduleId })
            .populate('performedBy', 'email role');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy nhật ký theo lịch', error: err.message });
    }
};

/**
 * Cập nhật ghi chú hoặc hoạt động trong log.
 */
exports.updateLog = async (req, res) => {
    try {
        const updated = await Log.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy log để cập nhật' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật log', error: err.message });
    }
};

/**
 * Xoá một log.
 */
exports.deleteLog = async (req, res) => {
    try {
        const deleted = await Log.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy log để xoá' });
        res.json({ message: 'Đã xoá log thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá log', error: err.message });
    }
};
