/**
 * Controller quản lý lịch chăm sóc (Schedule).
 * Bao gồm: tạo, lấy, cập nhật, xoá lịch cho trẻ.
 */

const Schedule = require('../models/Schedule');

/**
 * Tạo lịch chăm sóc mới cho một trẻ cụ thể.
 *
 * @param {Object} req - Request gồm childId, type, time, repeat
 * @param {Object} res - Response trả về lịch đã tạo
 */
exports.createSchedule = async (req, res) => {
    try {
        const { childId, type, time, repeat } = req.body;
        const schedule = await Schedule.create({
            childId,
            type,
            time,
            repeat,
            createdBy: req.user.id
        });
        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tạo lịch chăm sóc', error: err.message });
    }
};

/**
 * Lấy tất cả lịch chăm sóc của một trẻ.
 *
 * @param {Object} req - Request chứa childId trong param
 * @param {Object} res - Response trả về danh sách lịch
 */
exports.getSchedulesByChild = async (req, res) => {
    try {
        const schedules = await Schedule.find({ childId: req.params.childId });
        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch chăm sóc', error: err.message });
    }
};

/**
 * Cập nhật thông tin lịch chăm sóc theo ID.
 *
 * @param {Object} req - Request chứa ID lịch và thông tin cập nhật
 * @param {Object} res - Response trả về lịch đã cập nhật
 */
exports.updateSchedule = async (req, res) => {
    try {
        const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy lịch' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật lịch', error: err.message });
    }
};

/**
 * Xoá một lịch chăm sóc khỏi hệ thống.
 *
 * @param {Object} req - Request chứa ID lịch cần xoá
 * @param {Object} res - Response xác nhận xoá thành công
 */
exports.deleteSchedule = async (req, res) => {
    try {
        const deleted = await Schedule.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy lịch để xoá' });
        res.json({ message: 'Đã xoá lịch thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xoá lịch', error: err.message });
    }
};
