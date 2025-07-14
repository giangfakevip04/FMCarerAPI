const nodemailer = require('nodemailer');

/**
 * Tạo transporter gửi email thông qua Gmail.
 * Cần App Password từ Gmail để hoạt động.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'giangtvph38936@fpt.edu.vn', // ✏️ Email gửi
        pass: 'ezlhmzvmdpafxejw'           // ✏️ Mật khẩu ứng dụng (App Password)
    }
});

/**
 * Gửi email đơn giản.
 *
 * @param {string} to - Địa chỉ email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} text - Nội dung email (dạng text)
 * @returns {Promise<void>} - Promise báo kết quả gửi
 */
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: '"FMCarer" <giangtvph38936@fpt.edu.vn>',
            to,
            subject,
            text
        });
        console.log("✅ Email đã gửi:", to);
    } catch (err) {
        console.error("❌ Gửi email thất bại:", err);
        throw err;
    }
};

module.exports = sendEmail;
