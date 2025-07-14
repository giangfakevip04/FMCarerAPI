const Child = require('../models/Child');

/**
 * Lấy danh sách tất cả trẻ thuộc người dùng hiện tại (từ token).
 * @route GET /api/children/my
 * @access Riêng tư
 */
exports.getChildrenByUser = async (req, res) => {
    try {
        const user_id = req.user?.userId;

        if (!user_id) {
            return res.status(401).json({ success: false, message: 'Không xác định được người dùng từ token.' });
        }

        const children = await Child.find({ user_id }).sort({ created_at: -1 });
        return res.json({ success: true, data: children });
    } catch (err) {
        console.error('Lỗi lấy danh sách trẻ:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách trẻ', error: err.message });
    }
};

/**
 * Lấy thông tin chi tiết của một trẻ theo ID.
 * Chỉ cho phép lấy nếu trẻ thuộc user hiện tại.
 * @route GET /api/children/:childId
 * @access Riêng tư
 */
exports.getChildById = async (req, res) => {
    try {
        const { childId } = req.params;
        const user_id = req.user?.userId;

        const child = await Child.findOne({ _id: childId, user_id });
        if (!child) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ hoặc không có quyền truy cập' });
        }

        return res.json({ success: true, data: child });
    } catch (err) {
        console.error('Lỗi lấy chi tiết trẻ:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy trẻ', error: err.message });
    }
};

/**
 * Tạo mới hồ sơ một trẻ cho người dùng hiện tại.
 * @route POST /api/children
 * @access Riêng tư
 */
exports.createChild = async (req, res) => {
    try {
        const user_id = req.user?.userId;
        const { name, dob, gender, avatar_url } = req.body;

        if (!user_id || !name || !dob || !gender) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
        }

        const newChild = new Child({
            user_id,
            name,
            dob,
            gender,
            avatar_url: avatar_url || null
        });

        const savedChild = await newChild.save();
        return res.status(201).json({ success: true, data: savedChild });
    } catch (err) {
        console.error('Lỗi tạo trẻ:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo trẻ', error: err.message });
    }
};

/**
 * Cập nhật thông tin một trẻ theo ID.
 * Chỉ cho phép cập nhật nếu trẻ thuộc user hiện tại.
 * @route PUT /api/children/:childId
 * @access Riêng tư
 */
exports.updateChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const { name, dob, gender, avatar_url } = req.body;
        const user_id = req.user?.userId;

        const child = await Child.findOne({ _id: childId, user_id });
        if (!child) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ hoặc không có quyền cập nhật' });
        }

        // Cập nhật dữ liệu
        if (name !== undefined) child.name = name;
        if (dob !== undefined) child.dob = dob;
        if (gender !== undefined) child.gender = gender;
        if (avatar_url !== undefined) child.avatar_url = avatar_url;

        const updated = await child.save();

        return res.json({ success: true, data: updated });
    } catch (err) {
        console.error('Lỗi cập nhật trẻ:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trẻ', error: err.message });
    }
};

/**
 * Xoá hồ sơ một trẻ theo ID.
 * Chỉ xoá nếu trẻ thuộc user hiện tại.
 * @route DELETE /api/children/:childId
 * @access Riêng tư
 */
exports.deleteChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const user_id = req.user?.userId;

        const deleted = await Child.findOneAndDelete({ _id: childId, user_id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trẻ hoặc không có quyền xóa' });
        }

        return res.json({ success: true, message: 'Xóa trẻ thành công' });
    } catch (err) {
        console.error('Lỗi xóa trẻ:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa trẻ', error: err.message });
    }
};
