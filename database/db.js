const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * @desc Kết nối đến cơ sở dữ liệu MongoDB và tạo tài khoản admin mặc định nếu chưa tồn tại.
 * @returns {Promise<void>} - Không trả về giá trị, chỉ thực hiện kết nối và tạo admin.
 * @throws {Error} - Lỗi nếu kết nối MongoDB thất bại hoặc tạo admin gặp sự cố.
 */
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/FMCarer', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected!');

        const adminEmail = 'giangfake4@gmail.com';
        const adminPassword = 'Admin@123#';

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const newAdmin = new User({
                email: adminEmail,
                password: adminPassword, // Để pre('save') mã hóa
                role: 'admin',
                isVerified: true,
                fullname: 'Trinh Van Giang'
            });

            await newAdmin.save();
            console.log('✅ Admin mặc định đã được tạo');
        } else {
            console.log('ℹ️ Admin đã tồn tại, không cần tạo lại');
        }
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;