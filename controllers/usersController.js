const User = require('../models/User');
const OTP = require('../models/OTP'); // Giả định OTP model vẫn được sử dụng nếu có chức năng liên quan đến OTP
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/token'); // Đảm bảo đường dẫn này đúng
const crypto = require('crypto'); // Import module crypto để tạo chuỗi ngẫu nhiên

/**
 * @desc Chuẩn hóa số điện thoại để lưu trữ đồng nhất.
 * @param {string} phone - Số điện thoại cần chuẩn hóa.
 * @returns {string} - Số điện thoại đã được chuẩn hóa.
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    // Loại bỏ tất cả ký tự không phải số
    let cleanedPhone = phone.replace(/\D/g, '');

    // Nếu số điện thoại bắt đầu bằng '0' và có 10 chữ số (chuẩn VN)
    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
        return cleanedPhone; // Giữ nguyên '0'
    }
    // Nếu số điện thoại có 9 chữ số (ví dụ: '389456321') và bạn muốn lưu có '0'
    else if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('0')) {
        return '0' + cleanedPhone; // Thêm '0' vào đầu
    }
    return cleanedPhone; // Trả về như cũ nếu không khớp quy tắc
};

// --- Quản lý người dùng chung (Parent và Subuser) --- //

/**
 * @desc Lấy danh sách tất cả người dùng trong hệ thống (bao gồm cả parent và subuser).
 * @route GET /api/users/users
 * @access Public (có thể cần auth cho production)
 * @param {Object} req - Yêu cầu HTTP.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON chứa danh sách người dùng.
 * @throws {Error} - Lỗi server nếu truy vấn thất bại.
 */
exports.getAllUsers = async (req, res) => {
    try {
        // Lấy tất cả người dùng và ẩn trường password
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách người dùng thành công.',
            users
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách user:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách người dùng.'
        });
    }
};

// --- Đăng ký và Đăng nhập tài khoản chính (Parent) --- //

/**
 * @desc Đăng ký tài khoản Parent mới.
 * @route POST /api/users/register
 * @access Public
 * @param {Object} req - Yêu cầu HTTP chứa thông tin đăng ký.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.email - Email của người dùng.
 * @param {string} req.body.password - Mật khẩu của người dùng.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON với thông tin người dùng đã đăng ký.
 * @throws {Error} - Lỗi nếu email đã tồn tại hoặc server gặp sự cố.
 */
exports.registerParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới với role 'parent' và tự động xác minh
        const newUser = await User.create({
            email,
            password: hashedPassword,
            isVerified: true, // Tự động xác minh cho tài khoản parent
            role: 'parent'
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản chính thành công.',
            user: {
                _id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname || '',
                numberphone: newUser.numberphone || '',
                image: newUser.image || ''
            }
        });

    } catch (err) {
        console.error('Lỗi đăng ký tài khoản chính:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký tài khoản chính.' });
    }
};

/**
 * @desc Đăng nhập tài khoản Parent.
 * @route POST /api/users/login
 * @access Public
 * @param {Object} req - Yêu cầu HTTP chứa thông tin đăng nhập.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.email - Email của người dùng.
 * @param {string} req.body.password - Mật khẩu của người dùng.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON chứa token và thông tin người dùng.
 * @throws {Error} - Lỗi nếu thông tin đăng nhập sai hoặc tài khoản bị đình chỉ.
 */
exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra đầy đủ thông tin
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        // Tìm người dùng với email và role 'parent'
        const user = await User.findOne({ email, role: 'parent' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        // --- BẮT ĐẦU THÊM KIỂM TRA isSuspended ---
        if (user.isSuspended) {
            console.log(`❌ Đăng nhập tài khoản chính thất bại: Tài khoản '${email}' đã bị đình chỉ.`);
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên.' });
        }
        // --- KẾT THÚC THÊM KIỂM TRA isSuspended ---

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }

        // Tạo JWT token
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập tài khoản chính thành công!',
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                fullname: user.fullname,
                numberphone: user.numberphone,
                image: user.image
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập tài khoản chính:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập tài khoản chính.' });
    }
};

// --- Quản lý thông tin tài khoản (Parent hoặc Subuser) --- //

/**
 * @desc Cập nhật thông tin người dùng (fullname, numberphone, image).
 * @route POST /api/users/update
 * @access Private (cần xác thực)
 * @param {Object} req - Yêu cầu HTTP chứa thông tin cần cập nhật.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body._id - ID của người dùng cần cập nhật.
 * @param {string} [req.body.fullname] - Tên đầy đủ của người dùng.
 * @param {string} [req.body.numberphone] - Số điện thoại của người dùng.
 * @param {string} [req.body.image] - Đường dẫn ảnh đại diện.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON với thông tin người dùng đã cập nhật.
 * @throws {Error} - Lỗi nếu ID không hợp lệ hoặc người dùng không tồn tại.
 */
exports.updateUser = async (req, res) => {
    try {
        const { _id, fullname, numberphone, image } = req.body;

        // Kiểm tra ID hợp lệ
        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        // Tìm người dùng theo ID
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Cập nhật các trường nếu có
        if (fullname !== undefined) user.fullname = fullname;
        // Chuẩn hóa số điện thoại trước khi lưu
        if (numberphone !== undefined) user.numberphone = normalizePhoneNumber(numberphone);
        if (image !== undefined) user.image = image;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công.',
            user
        });
    } catch (err) {
        console.error('Lỗi cập nhật thông tin người dùng:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật người dùng.' });
    }
};

/**
 * @desc Upload ảnh đại diện cho người dùng.
 * @route POST /api/users/upload-avatar
 * @access Private (cần xác thực)
 * @param {Object} req - Yêu cầu HTTP chứa file ảnh và userId.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.userId - ID của người dùng.
 * @param {Object} req.file - File ảnh được upload qua middleware Multer.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON với thông tin ảnh và người dùng đã cập nhật.
 * @throws {Error} - Lỗi nếu ID không hợp lệ, người dùng không tồn tại, hoặc không có file ảnh.
 */
exports.uploadAvatar = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra xem có file ảnh được upload không
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
        }

        // Lưu đường dẫn file (đường dẫn này phụ thuộc vào cấu hình Multer của bạn)
        const imagePath = `/uploads/${req.file.filename}`;
        user.image = imagePath;
        await user.save();

        // Tạo JWT token mới sau khi cập nhật avatar
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Tải ảnh đại diện thành công.',
            image: imagePath,
            token,
            user: {
                _id: user._id,
                email: user.email,
                fullname: user.fullname,
                numberphone: user.numberphone,
                image: user.image,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Lỗi tải ảnh đại diện:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải ảnh đại diện.' });
    }
};

// --- Quản lý tài khoản phụ (Subuser) --- //

/**
 * @desc Lấy tất cả danh sách Subuser của một Parent cụ thể.
 * @route GET /api/users/subusers/parent/:parentId
 * @access Private (chỉ parent hoặc admin)
 * @param {Object} req - Yêu cầu HTTP chứa parentId trong params.
 * @param {Object} req.params - Tham số URL.
 * @param {string} req.params.parentId - ID của Parent.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON chứa danh sách subuser.
 * @throws {Error} - Lỗi nếu parentId không hợp lệ hoặc server gặp sự cố.
 */
exports.getAllSubusersByParentId = async (req, res) => {
    try {
        const { parentId } = req.params;

        if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

        // Tìm tất cả subuser có created_by là parentId
        const subusers = await User.find({ created_by: parentId, role: 'subuser' }).select('-password');

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách subuser thành công.',
            subusers
        });
    } catch (err) {
        console.error('Lỗi khi lấy danh sách subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách subuser.' });
    }
};

/**
 * @desc Lấy thông tin một Subuser cụ thể bằng ID.
 * @route GET /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser hoặc admin)
 * @param {Object} req - Yêu cầu HTTP chứa subuserId trong params.
 * @param {Object} req.params - Tham số URL.
 * @param {string} req.params.subuserId - ID của Subuser.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON chứa thông tin subuser.
 * @throws {Error} - Lỗi nếu subuserId không hợp lệ hoặc không tìm thấy subuser.
 */
exports.getSubuserById = async (req, res) => {
    try {
        const { subuserId } = req.params;

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'Subuser ID không hợp lệ.' });
        }

        // Tìm subuser theo ID và đảm bảo đó là subuser
        const subuser = await User.findOne({ _id: subuserId, role: 'subuser' }).select('-password');

        if (!subuser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy subuser.' });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin subuser thành công.',
            subuser
        });
    } catch (err) {
        console.error('Lỗi khi lấy thông tin subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin subuser.' });
    }
};

/**
 * @desc Tạo mới hoặc cập nhật thông tin Subuser.
 * @route POST /api/users/subuser/create-or-update
 * @access Private (chỉ parent)
 * @param {Object} req - Yêu cầu HTTP chứa thông tin subuser.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.numberphone - Số điện thoại của subuser.
 * @param {string} req.body.password - Mật khẩu của subuser.
 * @param {string} req.body.parentId - ID của Parent.
 * @param {string} [req.body.fullname] - Tên đầy đủ của subuser.
 * @param {string} [req.body.image] - Đường dẫn ảnh đại diện.
 * @param {string} [req.body.relationship] - Quan hệ với parent.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON với thông tin subuser đã tạo hoặc cập nhật.
 * @throws {Error} - Lỗi nếu thông tin không hợp lệ, giới hạn subuser, hoặc trùng email.
 */
exports.createOrUpdateSubuser = async (req, res) => {
    try {
        let { numberphone, password, fullname, image, parentId } = req.body;
        const relationship = req.body.relationship || 'unknown';

        // --- CONSOLE LOG 1: Log toàn bộ request body nhận được ---
        console.log(`[DEBUG - createOrUpdateSubuser] Received request body: ${JSON.stringify(req.body)}`);

        // Chuẩn hóa số điện thoại
        numberphone = normalizePhoneNumber(numberphone);
        // --- CONSOLE LOG 2: Log số điện thoại sau khi chuẩn hóa ---
        console.log(`[DEBUG - createOrUpdateSubuser] Normalized numberphone: ${numberphone}`);

        // Kiểm tra các trường bắt buộc
        if (!numberphone || !password || !parentId) {
            // --- CONSOLE ERROR 3: Cảnh báo lỗi thiếu trường ---
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Missing required fields. numberphone: ${!!numberphone}, password: ${!!password}, parentId: ${!!parentId}. Full Request Body: ${JSON.stringify(req.body)}`);
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin: số điện thoại, mật khẩu, và Parent ID.' });
        }

        // Kiểm tra định dạng Parent ID
        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            // --- CONSOLE ERROR 4: Cảnh báo lỗi định dạng Parent ID ---
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Invalid Parent ID format provided: ${parentId}.`);
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

        // Đảm bảo parentId tồn tại và có role 'parent'
        const parent = await User.findOne({ _id: parentId, role: 'parent' });
        // --- CONSOLE LOG 5: Kiểm tra kết quả tìm Parent ---
        console.log(`[DEBUG - createOrUpdateSubuser] Parent check result for ID ${parentId}: ${parent ? 'Found' : 'Not Found or wrong role'}`);
        if (!parent) {
            // --- CONSOLE ERROR 6: Cảnh báo Parent không tồn tại ---
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Parent account not found or does not have 'parent' role for ID: ${parentId}.`);
            return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản Parent với Parent ID này.' });
        }

        // Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // --- CONSOLE LOG 7: Thông báo mật khẩu đã được hash ---
        console.log(`[DEBUG - createOrUpdateSubuser] Password hashed successfully for numberphone: ${numberphone}`);

        // Tìm subuser hiện có bằng numberphone và parentId
        let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });
        // --- CONSOLE LOG 8: Thông báo kết quả tìm kiếm subuser hiện có ---
        console.log(`[DEBUG - createOrUpdateSubuser] Searching for existing subuser with numberphone ${numberphone} and created_by ${parentId}. Found: ${subuser ? 'Yes, ID: ' + subuser._id : 'No'}.`);

        if (subuser) {
            // --- CONSOLE INFO 9: Bắt đầu quá trình cập nhật subuser ---
            console.log(`[INFO - createOrUpdateSubuser] Updating existing subuser (ID: ${subuser._id}) for parent (ID: ${parentId}).`);

            // Cập nhật các trường
            subuser.password = hashedPassword;
            subuser.fullname = fullname ?? subuser.fullname;
            subuser.image = image ?? subuser.image;
            subuser.relationship = relationship;

            await subuser.save();
            // --- CONSOLE INFO 10: Thông báo cập nhật thành công ---
            console.log(`[INFO - createOrUpdateSubuser] Subuser (ID: ${subuser._id}) updated successfully.`);

            return res.status(200).json({ success: true, message: 'Cập nhật subuser thành công.', user: subuser });
        }

        // Nếu subuser chưa tồn tại, kiểm tra giới hạn số lượng subuser
        const subuserCount = await User.countDocuments({ role: 'subuser', created_by: parentId });
        // --- CONSOLE LOG 11: Thông báo số lượng subuser hiện tại ---
        console.log(`[DEBUG - createOrUpdateSubuser] Subuser count for parent ${parentId}: ${subuserCount}.`);

        if (subuserCount >= 10) {
            // --- CONSOLE WARN 12: Cảnh báo vượt quá giới hạn subuser ---
            console.warn(`[WARN - createOrUpdateSubuser] Failed to create subuser: Parent ${parentId} has reached the limit of 10 subusers.`);
            return res.status(400).json({ success: false, message: 'Tài khoản Parent đã đạt giới hạn 10 subuser.' });
        }

        // Tạo email placeholder duy nhất cho subuser mới
        const uniqueEmail = `subuser_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@fmcarer.com`;
        // --- CONSOLE LOG 13: Thông báo email placeholder được tạo ---
        console.log(`[DEBUG - createOrUpdateSubuser] Generated unique email for new subuser: ${uniqueEmail}`);

        // Tạo subuser mới
        subuser = new User({
            numberphone,
            password: hashedPassword,
            fullname: fullname || '',
            image: image || '',
            role: 'subuser',
            created_by: parentId,
            email: uniqueEmail
        });

        await subuser.save();
        // --- CONSOLE INFO 14: Thông báo tạo subuser mới thành công ---
        console.log(`[INFO - createOrUpdateSubuser] New subuser created successfully. Subuser ID: ${subuser._id}.`);

        return res.status(201).json({ success: true, message: 'Tạo subuser thành công.', user: subuser });

    } catch (error) {
        // --- CONSOLE ERROR 15: Log lỗi tổng quát (quan trọng) ---
        console.error(`[CRITICAL ERROR - createOrUpdateSubuser] Caught exception: ${error.message}`);
        console.error(`Stack trace:`, error.stack);
        console.error(`Request body that caused error:`, req.body);
        console.error(`Full error object:`, error);

        // Xử lý lỗi trùng lặp email (MongoDB E11000 duplicate key error)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // --- CONSOLE WARN 16: Cảnh báo lỗi trùng lặp email ---
            console.warn(`[WARN - createOrUpdateSubuser] Duplicate email error detected during subuser creation/update. Email pattern: ${JSON.stringify(error.keyPattern)}`);
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp email. Vui lòng thử lại hoặc liên hệ hỗ trợ.' });
        }

        // Trả về lỗi server mặc định
        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý subuser.', error: error.message });
    }
};

/**
 * @desc Xóa một Subuser cụ thể.
 * @route DELETE /api/users/subuser/:subuserId
 * @access Private (chỉ parent của subuser hoặc admin)
 * @param {Object} req - Yêu cầu HTTP chứa subuserId trong params.
 * @param {Object} req.params - Tham số URL.
 * @param {string} req.params.subuserId - ID của Subuser cần xóa.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON xác nhận xóa thành công.
 * @throws {Error} - Lỗi nếu subuserId không hợp lệ hoặc không tìm thấy subuser.
 */
exports.deleteSubuser = async (req, res) => {
    try {
        const { subuserId } = req.params;

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'ID subuser không hợp lệ.' });
        }

        // Tìm và xóa subuser. Đảm bảo chỉ xóa subuser
        const result = await User.deleteOne({ _id: subuserId, role: 'subuser' });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy subuser để xóa hoặc không phải là subuser.' });
        }

        res.status(200).json({ success: true, message: 'Xóa subuser thành công.' });
    } catch (err) {
        console.error('Lỗi khi xóa subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa subuser.' });
    }
};

/**
 * @desc Đăng nhập tài khoản Subuser.
 * @route POST /api/users/login-subuser
 * @access Public
 * @param {Object} req - Yêu cầu HTTP chứa thông tin đăng nhập.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.numberphone - Số điện thoại của subuser.
 * @param {string} req.body.password - Mật khẩu của subuser.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON chứa token và thông tin subuser.
 * @throws {Error} - Lỗi nếu thông tin đăng nhập sai hoặc server gặp sự cố.
 */
exports.loginSubuser = async (req, res) => {
    try {
        let { numberphone, password } = req.body;

        // Chuẩn hóa số điện thoại trước khi sử dụng để tìm kiếm
        numberphone = normalizePhoneNumber(numberphone);

        if (!numberphone || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu số điện thoại hoặc mật khẩu.' });
        }

        // Tìm người dùng với numberphone và role 'subuser'
        const user = await User.findOne({ numberphone, role: 'subuser' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        // Tạo JWT token cho subuser
        const token = generateToken({ userId: user._id, role: user.role });

        res.status(200).json({
            success: true,
            message: 'Đăng nhập subuser thành công!',
            token,
            user: {
                _id: user._id,
                numberphone: user.numberphone,
                fullname: user.fullname,
                role: user.role,
                image: user.image,
                created_by: user.created_by,
                relationship: user.relationship
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập subuser:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập subuser.' });
    }
};

/**
 * @desc Xác thực mật khẩu của người dùng.
 * @route POST /api/users/verify-password
 * @access Private
 * @param {Object} req - Yêu cầu HTTP chứa userId và password.
 * @param {Object} req.body - Dữ liệu gửi lên từ client.
 * @param {string} req.body.userId - ID của người dùng.
 * @param {string} req.body.password - Mật khẩu cần xác thực.
 * @param {Object} res - Đối tượng phản hồi HTTP.
 * @returns {Object} - Phản hồi JSON xác nhận mật khẩu hợp lệ.
 * @throws {Error} - Lỗi nếu userId không hợp lệ, người dùng không tồn tại, hoặc mật khẩu sai.
 */
exports.verifyPassword = async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID người dùng và mật khẩu.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        }

        // So sánh mật khẩu được cung cấp với mật khẩu đã hash trong DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không đúng.' });
        }

        res.status(200).json({ success: true, message: 'Mật khẩu đã được xác thực thành công.' });

    } catch (err) {
        console.error('Lỗi khi xác thực mật khẩu:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xác thực mật khẩu.' });
    }
};