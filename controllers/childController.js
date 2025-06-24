/**
 * Controller quản lý trẻ em (Child).
 * Gồm: thêm, xem danh sách, cập nhật, xoá trẻ.
 */

const Child = require('../models/Child');

/**
 * Thêm thông tin trẻ mới cho user hiện tại.
 *
 * @param {Object} req - Request chứa tên, ngày sinh, giới tính
 * @param {Object} res - Response trả về thông tin trẻ vừa tạo
 */
exports.addChild = async (req, res) => {
    try {
        const { name, birthDate, gender } = req.body;
        const child = await Child.create({
            name,
            birthDate,
            gender,
            parentId: req.user.id
        });
        res.status(201).json(child);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi thêm trẻ', error: err.message });
    }
};

/**
 * Lấy danh sách trẻ em thuộc tài khoản hiện tại.
 *
 * @param {Object} req - Request từ user đã đăng nhập
 * @param {Object} res - Response gồm danh sách trẻ
 */
exports.getChildren = async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user.id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách trẻ', error: err.message });
    }
};

/**
 * Cập nhật thông tin trẻ theo ID và quyền sở hữu.
 *
 * @param {Object} req - Request chứa ID và dữ liệu cập nhật
 * @param {Object} res - Response trả về trẻ đã cập nhật
 */
exports.updateChild = async (req, res) => {
    try {
        const updated = await Child.findOneAndUpdate(
            { _id: req.params.id, parentId: req.user.id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy trẻ' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật trẻ', error: err.message });
    }
};

/**
 * Xoá thông tin trẻ khỏi hệ thống.
 *
 * @param {Object} req - Request chứa ID trẻ cần xoá
 * @param {Object} res - Response xác nhận xoá thành công
 */
exports.deleteChild = async (req, res) => {
    try {
        const deleted = await Child.findOneAndDelete({
            _id: req.params.id,
            parentId: req.user.id
        });
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy trẻ để xoá' });
        res.json({ message: 'Đã xoá trẻ thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá trẻ', error: err.message });
    }
};
