/**
 * @file app.js
 * @description Cấu hình chính của ứng dụng backend FMCarer (Express + MongoDB).
 * Ứng dụng cung cấp các API RESTful phục vụ cho mobile/web client, loại bỏ hoàn toàn các view động (EJS, HTML).
 */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Kết nối MongoDB
const connectDB = require('./database/db');

// Khởi tạo ứng dụng Express
const app = express();

/**
 * Kết nối cơ sở dữ liệu MongoDB
 */
connectDB();

// Load tất cả các model cần thiết (đảm bảo schema được đăng ký với Mongoose)
require('./models/AdminLog');
require('./models/Child');
require('./models/DiaryEntry');
require('./models/Media');
require('./models/Reminder');
require('./models/Report');
require('./models/Notification');
require('./models/Payment');
require('./models/User');
require('./models/SupportTicket');
require('./models/Posts');
require('./models/OTP');

// Gọi upload middleware để định nghĩa cấu hình Multer
require('./middlewares/upload');

// Import các route (API modules)
const otpRoutes = require('./routes/otpRoutes');
const usersRoutes = require('./routes/usersRoutes');
const childRoutes = require('./routes/childRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const diaryEntriesRoutes = require('./routes/diaryEntriesRoutes');
const logRoutes = require('./routes/logRoutes');

// Middleware mặc định
app.use(logger('dev'));                         // Ghi log HTTP request
app.use(express.json());                        // Parse JSON body
app.use(express.urlencoded({ extended: false })); // Parse form-urlencoded body
app.use(cookieParser());                        // Đọc cookies từ request

// Phục vụ tệp tĩnh (ảnh) từ thư mục uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Đăng ký các tuyến API chính theo chức năng
 */
app.use('/api/users', usersRoutes);               // Xử lý đăng ký, đăng nhập, quản lý user
app.use('/api/users', otpRoutes);                 // Gửi OTP qua email
app.use('/api/children', childRoutes);            // Quản lý trẻ em
app.use('/api/reminders', reminderRoutes);        // Quản lý nhắc nhở
app.use('/api/posts', postRoutes);                // Quản lý bài viết
app.use('/api', uploadRoutes);                    // Upload ảnh
app.use('/api/diaryentries', diaryEntriesRoutes); // Nhật ký hoạt động
app.use('/api/logs', logRoutes);                  // Nhật ký chăm sóc (log từ reminder)

// Middleware xử lý lỗi 404
app.use((req, res, next) => {
    next(createError(404));
});

/**
 * Middleware xử lý lỗi tổng quát (không render view, chỉ trả JSON)
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const isDev = req.app.get('env') === 'development';

    res.status(status).json({
        status,
        message: err.message,
        ...(isDev && { stack: err.stack })
    });
});

// Lắng nghe cổng server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

module.exports = app;
