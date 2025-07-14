const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs để kiểm tra sự tồn tại của thư mục

/**
 * @file upload.js
 * @description Cấu hình middleware Multer để xử lý upload file lên thư mục `uploads/` cục bộ.
 * Nếu thư mục không tồn tại thì tự động tạo.
 */

// Thiết lập nơi lưu file tạm thời (có thể thay bằng Cloudinary hoặc S3 nếu cần)
const storage = multer.diskStorage({
    /**
     * Xác định thư mục lưu trữ tệp tin.
     * Nếu thư mục `uploads/` chưa tồn tại, sẽ tự động tạo mới.
     * @param {Request} req
     * @param {Express.Multer.File} file
     * @param {Function} cb - Callback để Multer tiếp tục xử lý
     */
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        const absoluteUploadDir = path.join(__dirname, '..', uploadDir);

        if (!fs.existsSync(absoluteUploadDir)) {
            console.log(`Thư mục '${absoluteUploadDir}' không tồn tại. Đang cố gắng tạo...`);
            try {
                fs.mkdirSync(absoluteUploadDir, { recursive: true });
                console.log(`Đã tạo thư mục '${absoluteUploadDir}' thành công.`);
            } catch (error) {
                console.error(`Lỗi khi tạo thư mục '${absoluteUploadDir}':`, error);
                return cb(new Error(`Không thể tạo thư mục upload: ${absoluteUploadDir}. Lỗi: ${error.message}`), null);
            }
        } else {
            console.log(`Thư mục upload '${absoluteUploadDir}' đã tồn tại.`);
        }

        console.log(`Multer: Đang lưu file vào thư mục: ${uploadDir}`);
        cb(null, uploadDir);
    },

    /**
     * Xác định tên file được lưu.
     * Định dạng: <timestamp>.<ext> (vd: 1720875900000.jpg)
     * @param {Request} req
     * @param {Express.Multer.File} file
     * @param {Function} cb - Callback để Multer tiếp tục xử lý
     */
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = Date.now() + ext;
        console.log(`Multer: Đang đặt tên file: ${fileName}`);
        cb(null, fileName);
    }
});

/**
 * Middleware upload mặc định dùng cấu hình lưu vào thư mục `uploads/`.
 * @type {import('multer').Multer}
 */
const upload = multer({ storage });

module.exports = upload;
