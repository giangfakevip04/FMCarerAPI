const Reminder = require('../models/Reminder');
const Child = require('../models/Child');

/**
 * Tạo mới một nhắc nhở (reminder) cho trẻ.
 * Chỉ cho phép nếu child thuộc về người dùng hiện tại.
 * @route POST /api/reminders
 * @access Riêng tư (yêu cầu xác thực)
 */
exports.createReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const {
            child_id,
            type,
            note,
            reminder_date,
            reminder_time,
            repeat,
            repeat_type,
            custom_type
        } = req.body;

        if (!user_id || !child_id || !type || !reminder_date || !reminder_time) {
            return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' });
        }

        const childExists = await Child.findOne({ _id: child_id, user_id });
        if (!childExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ tương ứng với tài khoản' });
        }

        if (type === 'other' && (!custom_type || custom_type.trim() === '')) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập loại nhắc nhở khác (custom_type)' });
        }

        const reminder = new Reminder({
            user_id,
            child_id,
            type,
            note,
            reminder_date,
            reminder_time,
            repeat,
            repeat_type,
            custom_type
        });

        await reminder.save();
        const populated = await reminder.populate('child_id');

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Lỗi khi tạo reminder', error: error.message });
    }
};

/**
 * Lấy tất cả nhắc nhở thuộc người dùng hiện tại (theo token).
 * @route GET /api/reminders
 * @access Riêng tư
 */
exports.getRemindersByUser = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        if (!user_id) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng từ token' });
        }

        const reminders = await Reminder.find({ user_id }).populate('child_id');
        res.json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách', error: error.message });
    }
};

/**
 * Lấy một nhắc nhở cụ thể theo ID, kiểm tra quyền truy cập của người dùng.
 * @route GET /api/reminders/:id
 * @access Riêng tư
 */
exports.getReminderById = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const reminder = await Reminder.findOne({ _id: req.params.id, user_id }).populate('child_id');
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền truy cập' });
        }
        res.json({ success: true, data: reminder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder', error: error.message });
    }
};

/**
 * Lấy danh sách nhắc nhở theo ID của trẻ.
 * Chỉ cho phép nếu trẻ thuộc về người dùng hiện tại.
 * @route GET /api/reminders/by-child/:childId
 * @access Riêng tư
 */
exports.getRemindersByChild = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const { childId } = req.params;

        const child = await Child.findOne({ _id: childId, user_id });
        if (!child) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ hoặc không có quyền truy cập' });
        }

        const reminders = await Reminder.find({ child_id: childId, user_id }).populate('child_id');
        res.json({ success: true, data: reminders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy reminder theo trẻ', error: error.message });
    }
};

/**
 * Cập nhật nội dung của một nhắc nhở theo ID.
 * Chỉ cho phép nếu reminder thuộc user hiện tại.
 * @route PUT /api/reminders/:id
 * @access Riêng tư
 */
exports.updateReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const reminder = await Reminder.findOne({ _id: req.params.id, user_id });
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền cập nhật' });
        }

        Object.assign(reminder, req.body);
        const updated = await reminder.save();
        const populated = await updated.populate('child_id');
        res.json({ success: true, data: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Lỗi khi cập nhật reminder', error: error.message });
    }
};

/**
 * Xoá một nhắc nhở theo ID.
 * Chỉ cho phép nếu reminder thuộc user hiện tại.
 * @route DELETE /api/reminders/:id
 * @access Riêng tư
 */
exports.deleteReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const deleted = await Reminder.findOneAndDelete({ _id: req.params.id, user_id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền xoá' });
        }
        res.json({ success: true, message: 'Đã xoá reminder thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xoá reminder', error: error.message });
    }
};

/**
 * Đánh dấu một nhắc nhở là đã hoàn thành.
 * @route PUT /api/reminders/:id/complete
 * @access Riêng tư
 */
exports.completeReminder = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const reminder = await Reminder.findOne({ _id: req.params.id, user_id });
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reminder hoặc không có quyền cập nhật' });
        }

        reminder.is_completed = true;
        const updated = await reminder.save();
        const populated = await updated.populate('child_id');
        res.json({ success: true, message: 'Đã hoàn thành nhắc nhở', data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi hoàn thành reminder', error: error.message });
    }
};
