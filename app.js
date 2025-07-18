/**
 * @file app.js
 * @description Cấu hình chính của ứng dụng Express cho hệ thống FMCarer.
 * Gồm kết nối MongoDB, cấu hình view engine, session, flash, routes, static files và xử lý lỗi.
 *
 * @author
 * @version 1.0.0
 */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Session và Flash messages
const session = require('express-session');
const flash = require('connect-flash');

// Kết nối cơ sở dữ liệu MongoDB
const connectDB = require('./database/db');

// Nạp các model Mongoose vào bộ nhớ
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

// Nạp middleware xử lý upload file
require('./middlewares/upload');

// Import các router
const otpRoute = require('./routes/otpRoutes');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/usersRoutes');
const childRoutes = require('./routes/childRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const diaryEntriesRoutes = require('./routes/diaryEntriesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRouter = require('./routes/paymentRoutes');

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối MongoDB
connectDB();

// Thiết lập View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware cơ bản
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Cấu hình session & flash
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_super_secret_key_please_change_this_in_production',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 giờ
    }
}));
app.use(flash());

// Truyền flash messages vào res.locals (EJS templates)
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gắn routes
app.use('/api/users', usersRouter);
app.use('/api/users', otpRoute);
app.use('/', indexRouter);
app.use('/api/children', childRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', uploadRoutes);
app.use('/api/diaryentries', diaryEntriesRoutes);
app.use('/admin', adminRoutes);
app.use('/api/payments', paymentRouter);

// Debug: Liệt kê các route đã đăng ký
console.log("\nRegistered routes (Method Path):");
if (app._router && app._router.stack) {
    app._router.stack.forEach(r => {
        if (r.route && r.route.path) {
            console.log(`${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
        } else if (r.name === 'router' && r.handle.stack) {
            r.handle.stack.forEach(handler => {
                if (handler.route && handler.route.path) {
                    const parentPath = r.regexp.source.replace(/\\|\^|\$/g, '');
                    const method = Object.keys(handler.route.methods)[0].toUpperCase();
                    const routePath = handler.route.path;
                    console.log(`${method} ${parentPath}${routePath}`);
                }
            });
        }
    });
} else {
    console.log("⚠️ Không thể truy cập danh sách route. Vui lòng kiểm tra cấu hình Express.");
}
console.log("\n");

/**
 * Middleware xử lý lỗi 404 - Not Found
 */
app.use((req, res, next) => {
    next(createError(404));
});

/**
 * Middleware xử lý lỗi tổng thể
 * @param {Error} err - Đối tượng lỗi
 * @param {express.Request} req - Yêu cầu HTTP
 * @param {express.Response} res - Phản hồi HTTP
 * @param {express.NextFunction} next - Middleware tiếp theo
 */
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);

    if (req.accepts('json')) {
        res.json({
            status: err.status || 500,
            message: err.message,
            error: req.app.get('env') === 'development' ? err : {}
        });
    } else {
        res.render('error');
    }
});

/**
 * Cổng chạy ứng dụng
 * @constant {number}
 */
const PORT = 5000;

/**
 * Khởi động server và lắng nghe trên tất cả các giao diện mạng
 */
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    // Để test từ điện thoại Android: dùng IP LAN thay vì localhost
});

module.exports = app;