const DiaryEntry = require('../models/DiaryEntry');
const mongoose = require('mongoose');

/**
 * Lấy tất cả các mục nhật ký.
 * Có thể lọc theo `child_id` hoặc `user_id` nếu được truyền qua query.
 * @route GET /api/diaryentries
 * @access Công khai (có thể chuyển thành riêng tư nếu cần xác thực)
 */
exports.getDiaryEntries = async (req, res) => {
    try {
        const { child_id, user_id } = req.query;

        let query = {};
        if (child_id) {
            if (!mongoose.Types.ObjectId.isValid(child_id)) {
                return res.status(400).json({ success: false, message: 'ID trẻ không hợp lệ.' });
            }
            query.child_id = child_id;
        }
        if (user_id) {
            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
            }
            query.user_id = user_id;
        }

        const diaryEntries = await DiaryEntry.find(query)
            .populate('child_id', 'name image')
            .populate('user_id', 'username email');

        res.status(200).json({ success: true, count: diaryEntries.length, data: diaryEntries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

/**
 * Lấy một mục nhật ký cụ thể theo ID.
 * @route GET /api/diaryentries/:id
 * @access Công khai
 */
exports.getDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id)
            .populate('child_id', 'name image')
            .populate('user_id', 'username email');

        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        res.status(200).json({ success: true, data: diaryEntry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

/**
 * Tạo một mục nhật ký mới (tạo thủ công, không phải từ nhắc nhở).
 * @route POST /api/diaryentries
 * @access Công khai (có thể điều chỉnh thành riêng tư nếu cần)
 */
exports.createDiaryEntry = async (req, res) => {
    try {
        const { child_id, type, user_id, activity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(child_id)) {
            return res.status(400).json({ success: false, message: 'ID trẻ không hợp lệ.' });
        }
        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const newDiaryEntry = await DiaryEntry.create({ child_id, type, user_id, activity });
        res.status(201).json({ success: true, data: newDiaryEntry });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

/**
 * Cập nhật một mục nhật ký theo ID.
 * Không cho phép cập nhật nếu mục đó được tạo từ nhắc nhở (`isFromReminder = true`).
 * @route PUT /api/diaryentries/:id
 * @access Công khai (có thể điều chỉnh thành riêng tư nếu cần)
 */
exports.updateDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id);
        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        if (diaryEntry.isFromReminder) {
            return res.status(403).json({
                success: false,
                message: 'Không thể cập nhật nhật ký được tạo từ nhắc nhở đã hoàn thành.'
            });
        }

        const { type, activity } = req.body;

        const updatedDiaryEntry = await DiaryEntry.findByIdAndUpdate(
            req.params.id,
            { type, activity },
            { new: true, runValidators: true }
        ).populate('child_id', 'name image')
            .populate('user_id', 'username email');

        res.status(200).json({ success: true, data: updatedDiaryEntry });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

/**
 * Xoá một mục nhật ký theo ID.
 * Không cho phép xoá nếu mục đó được tạo từ nhắc nhở (`isFromReminder = true`).
 * @route DELETE /api/diaryentries/:id
 * @access Công khai (có thể điều chỉnh thành riêng tư nếu cần)
 */
exports.deleteDiaryEntry = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID nhật ký không hợp lệ.' });
        }

        const diaryEntry = await DiaryEntry.findById(req.params.id);
        if (!diaryEntry) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục nhật ký.' });
        }

        if (diaryEntry.isFromReminder) {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa nhật ký được tạo từ nhắc nhở đã hoàn thành.'
            });
        }

        await DiaryEntry.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Đã xóa mục nhật ký thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
