const AdminLog = require('../models/AdminLog'); // Import AdminLog model (đã đơn giản hóa)

/**
 * @desc Ghi lại hành động của Admin vào cơ sở dữ liệu.
 * @param {string} adminId - ID của Admin đã thực hiện hành động.
 * @param {string} action - Mô tả hành động đã thực hiện.
 * @returns {Promise<void>} - Không trả về giá trị, chỉ ghi log vào cơ sở dữ liệu.
 * @throws {Error} - Lỗi nếu không thể lưu log vào cơ sở dữ liệu.
 */
const logAdminAction = async (adminId, action) => {
    try {
        const logEntry = new AdminLog({
            admin_id: adminId, // ID của admin (từ req.user._id)
            action: action     // Mô tả hành động
        });
        await logEntry.save();
        console.log(`📝 Admin Action Logged: "${action}" by Admin ID: ${adminId}`);
    } catch (error) {
        console.error('❌ Lỗi khi ghi log Admin:', error);
    }
};

module.exports = logAdminAction;