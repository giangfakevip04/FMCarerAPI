const Child = require('../models/Child');

exports.addChild = async (req, res) => {
    try {
        const { name, birthDate, gender } = req.body;
        const newChild = await Child.create({
            name,
            birthDate,
            gender,
            parentId: req.user.id
        });
        res.status(201).json(newChild);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi thêm trẻ', error: err.message });
    }
};

exports.getChildren = async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user.id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách trẻ', error: err.message });
    }
};

exports.updateChild = async (req, res) => {
    try {
        const child = await Child.findOneAndUpdate(
            { _id: req.params.id, parentId: req.user.id },
            req.body,
            { new: true }
        );
        if (!child) return res.status(404).json({ message: 'Không tìm thấy trẻ' });
        res.json(child);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật trẻ', error: err.message });
    }
};

exports.deleteChild = async (req, res) => {
    try {
        const result = await Child.findOneAndDelete({ _id: req.params.id, parentId: req.user.id });
        if (!result) return res.status(404).json({ message: 'Không tìm thấy trẻ để xoá' });
        res.json({ message: 'Đã xoá trẻ thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi xoá trẻ', error: err.message });
    }
};
