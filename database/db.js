const mongoose = require('mongoose');

/**
 * Kết nối đến cơ sở dữ liệu MongoDB.
 *
 * - Sử dụng Mongoose để kết nối đến `mongodb://localhost:27017/FMCarer`.
 * - Nếu kết nối thành công, in ra console thông báo thành công.
 * - Nếu thất bại, in lỗi và kết thúc tiến trình.
 *
 * @function connectDB
 * @async
 */
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/FMCarer', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected!');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
