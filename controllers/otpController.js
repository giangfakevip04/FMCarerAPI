require('dotenv').config();
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const User = require('../models/User');

/**
 * Gửi mã OTP đến email người dùng để xác minh tài khoản.
 *
 * - Kiểm tra định dạng email.
 * - Kiểm tra trùng email đã tồn tại trong hệ thống.
 * - Tạo mã OTP ngẫu nhiên (6 chữ số) và lưu vào DB với thời hạn 5 phút.
 * - Gửi email chứa mã OTP sử dụng Gmail SMTP.
 *
 * @route POST /api/users/send-otp
 * @access Công khai
 */
exports.sendOtpToEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại. Vui lòng sử dụng một email khác.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mã 6 số
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        await OTP.deleteMany({ email }); // Xoá OTP cũ nếu có
        await OTP.create({ email, code, expiresAt });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'giangtvph38936@fpt.edu.vn',
                pass: 'ezlhmzvmdpafxejw', // App password từ Gmail
            },
        });

        const mailOptions = {
            from: 'FMCarer <giangtvph38936@fpt.edu.vn>',
            to: email,
            subject: 'Xác minh OTP',
            text: `Mã OTP của bạn là: ${code}. Mã này có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai.`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Lỗi gửi email:', err);
                return res.status(500).json({ success: false, message: 'Không thể gửi email.' });
            }

            return res.status(200).json({
                success: true,
                message: 'OTP đã gửi về email.',
                otp: code, // ❗ chỉ để test, không nên trả về trong môi trường production
            });
        });

    } catch (err) {
        console.error('Lỗi sendOtpToEmail:', err);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};
