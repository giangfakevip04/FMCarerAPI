/**
 * @module usersController
 * @description Controller handling user-related operations including registration, login, updates,
 * and subuser management for the FMCarer system.
 */

const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { generateToken } = require('../utils/token');
const crypto = require('crypto');

/**
 * @function normalizePhoneNumber
 * @description Normalizes a phone number by removing non-digit characters and ensuring a standard format (e.g., starting with '0' for Vietnam).
 * @param {string} phone - The raw phone number string.
 * @returns {string} - The normalized phone number or the original string if no rules apply.
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return phone;
    let cleanedPhone = phone.replace(/\D/g, '');

    if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
        return cleanedPhone;
    } else if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('0')) {
        return '0' + cleanedPhone;
    }
    return cleanedPhone;
};

/**
 * @function getAllUsers
 * @description Retrieves a list of all users (parents and subusers) in the system.
 * @route GET /api/users/users
 * @access Public (may require authentication in production)
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and user list.
 * @throws {Error} - Throws an error if database query fails.
 */
exports.getAllUsers = async (req, res) => {
    try {
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

/**
 * @function registerParent
 * @description Registers a new parent account.
 * @route POST /api/users/register
 * @access Public
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with registration data.
 * @param {string} req.body.email - The parent's email address.
 * @param {string} req.body.password - The parent's password (plaintext).
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and user details.
 * @throws {Error} - Throws an error if registration fails (e.g., duplicate email, database error).
 */
exports.registerParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }

        const newUser = await User.create({
            email,
            password,
            isVerified: true,
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
 * @function loginParent
 * @description Handles login for a parent account.
 * @route POST /api/users/login
 * @access Public
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with login data.
 * @param {string} req.body.email - The parent's email address.
 * @param {string} req.body.password - The parent's password (plaintext).
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, token, and user details.
 * @throws {Error} - Throws an error if login fails (e.g., invalid credentials, database error).
 */
exports.loginParent = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`[LOGIN_PARENT] 📥 Nhận yêu cầu đăng nhập cho email: ${email}`);
        console.log(`[DEBUG] Mật khẩu người dùng nhập (plaintext): ${password}`);

        if (!email || !password) {
            console.log(`[LOGIN_PARENT] ❌ Lỗi 400: Thiếu email hoặc mật khẩu cho email: ${email || 'không xác định'}.`);
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const user = await User.findOne({ email, role: 'parent' });
        if (!user) {
            console.log(`[LOGIN_PARENT] ❌ Lỗi 400: Không tìm thấy tài khoản parent với email: ${email} hoặc sai mật khẩu.`);
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }
        console.log(`[LOGIN_PARENT] ✅ Tìm thấy người dùng: ${user._id}, isSuspended: ${user.isSuspended} cho email: ${email}`);
        console.log(`[DEBUG] Mật khẩu đã hash trong DB: ${user.password}`);

        if (user.isSuspended) {
            console.log(`[LOGIN_PARENT] ❌ Lỗi 403: Tài khoản '${email}' đã bị đình chỉ. ID người dùng: ${user._id}`);
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[LOGIN_PARENT] ❌ Lỗi 400: Mật khẩu không khớp cho email: ${email}.`);
            return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu.' });
        }
        console.log(`[LOGIN_PARENT] ✅ Mật khẩu khớp cho email: ${email}.`);

        const token = generateToken({ userId: user._id, role: user.role });
        console.log(`[LOGIN_PARENT] ✅ Đã tạo JWT token cho người dùng: ${user._id}.`);

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
        console.log(`[LOGIN_PARENT] ✨ Đăng nhập thành công cho email: ${email}.`);
    } catch (err) {
        console.error(`[LOGIN_PARENT] ❌ Lỗi Server 500 khi đăng nhập tài khoản chính cho email: ${req.body.email || 'không xác định'}. Chi tiết lỗi:`, err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập tài khoản chính.' });
    }
};

/**
 * @function updateUser
 * @description Updates user information (fullname, numberphone, image).
 * @route POST /api/users/update
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with update data.
 * @param {string} req.body._id - The user's ID.
 * @param {string} [req.body.fullname] - The updated full name.
 * @param {string} [req.body.numberphone] - The updated phone number.
 * @param {string} [req.body.image] - The updated image path.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and updated user.
 * @throws {Error} - Throws an error if update fails (e.g., invalid ID, database error).
 */
exports.updateUser = async (req, res) => {
    try {
        const { _id, fullname, numberphone, image } = req.body;

        if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ.' });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        if (fullname !== undefined) user.fullname = fullname;
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
 * @function uploadAvatar
 * @description Uploads a profile picture for a user.
 * @route POST /api/users/upload-avatar
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with user ID.
 * @param {string} req.body.userId - The user's ID.
 * @param {Object} req.file - The uploaded file object (requires multer middleware).
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, image path, token, and user details.
 * @throws {Error} - Throws an error if upload fails (e.g., invalid ID, no file, database error).
 * @note Requires `upload.single('avatar')` middleware before this controller.
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

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        user.image = imagePath;
        await user.save();

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

/**
 * @function getAllSubusersByParentId
 * @description Retrieves all subusers for a specific parent.
 * @route GET /api/users/subusers/parent/:parentId
 * @access Private (only parent or admin can view their subusers)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.parentId - The ID of the parent.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and subuser list.
 * @throws {Error} - Throws an error if retrieval fails (e.g., invalid ID, database error).
 */
exports.getAllSubusersByParentId = async (req, res) => {
    try {
        const { parentId } = req.params;

        if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

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
 * @function getSubuserById
 * @description Retrieves information of a specific subuser by ID.
 * @route GET /api/users/subuser/:subuserId
 * @access Private (only parent of the subuser or admin can view)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.subuserId - The ID of the subuser.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and subuser details.
 * @throws {Error} - Throws an error if retrieval fails (e.g., invalid ID, database error).
 */
exports.getSubuserById = async (req, res) => {
    try {
        const { subuserId } = req.params;

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'Subuser ID không hợp lệ.' });
        }

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
 * @function createOrUpdateSubuser
 * @description Creates or updates a subuser based on phone number and parent ID.
 * Updates if subuser exists, creates if not, with a limit of 10 subusers per parent.
 * @route POST /api/users/subuser/create-or-update
 * @access Private (only parent can create/update their subusers)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with subuser data.
 * @param {string} req.body.numberphone - The subuser's phone number.
 * @param {string} req.body.password - The subuser's password (plaintext).
 * @param {string} [req.body.fullname] - The subuser's full name.
 * @param {string} [req.body.image] - The subuser's image path.
 * @param {string} req.body.parentId - The ID of the parent.
 * @param {string} [req.body.relationship] - The relationship with the parent.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, and subuser details.
 * @throws {Error} - Throws an error if creation/update fails (e.g., invalid data, database error).
 */
exports.createOrUpdateSubuser = async (req, res) => {
    try {
        let { numberphone, password, fullname, image, parentId } = req.body;
        const relationship = req.body.relationship || 'unknown';

        console.log(`[DEBUG - createOrUpdateSubuser] Received request body: ${JSON.stringify(req.body)}`);

        numberphone = normalizePhoneNumber(numberphone);
        console.log(`[DEBUG - createOrUpdateSubuser] Normalized numberphone: ${numberphone}`);

        if (!numberphone || !password || !parentId) {
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Missing required fields. numberphone: ${!!numberphone}, password: ${!!password}, parentId: ${!!parentId}. Full Request Body: ${JSON.stringify(req.body)}`);
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin: số điện thoại, mật khẩu, và Parent ID.' });
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Invalid Parent ID format provided: ${parentId}.`);
            return res.status(400).json({ success: false, message: 'Parent ID không hợp lệ.' });
        }

        const parent = await User.findOne({ _id: parentId, role: 'parent' });
        console.log(`[DEBUG - createOrUpdateSubuser] Parent check result for ID ${parentId}: ${parent ? 'Found' : 'Not Found or wrong role'}`);
        if (!parent) {
            console.error(`[ERROR - createOrUpdateSubuser] Bad Request: Parent account not found or does not have 'parent' role for ID: ${parentId}.`);
            return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản Parent với Parent ID này.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`[DEBUG - createOrUpdateSubuser] Password hashed successfully for numberphone: ${numberphone}`);

        let subuser = await User.findOne({ numberphone, role: 'subuser', created_by: parentId });
        console.log(`[DEBUG - createOrUpdateSubuser] Searching for existing subuser with numberphone ${numberphone} and created_by ${parentId}. Found: ${subuser ? 'Yes, ID: ' + subuser._id : 'No'}`);

        if (subuser) {
            console.log(`[INFO - createOrUpdateSubuser] Updating existing subuser (ID: ${subuser._id}) for parent (ID: ${parentId}).`);

            subuser.password = hashedPassword;
            subuser.fullname = fullname ?? subuser.fullname;
            subuser.image = image ?? subuser.image;
            subuser.relationship = relationship;

            await subuser.save();
            console.log(`[INFO - createOrUpdateSubuser] Subuser (ID: ${subuser._id}) updated successfully.`);

            return res.status(200).json({ success: true, message: 'Cập nhật subuser thành công.', user: subuser });
        }

        const subuserCount = await User.countDocuments({ role: 'subuser', created_by: parentId });
        console.log(`[DEBUG - createOrUpdateSubuser] Subuser count for parent ${parentId}: ${subuserCount}`);

        if (subuserCount >= 10) {
            console.warn(`[WARN - createOrUpdateSubuser] Failed to create subuser: Parent ${parentId} has reached the limit of 10 subusers.`);
            return res.status(400).json({ success: false, message: 'Tài khoản Parent đã đạt giới hạn 10 subuser.' });
        }

        const uniqueEmail = `subuser_${Date.now()}_${crypto.randomBytes(4).toString('hex')}@fmcarer.com`;
        console.log(`[DEBUG - createOrUpdateSubuser] Generated unique email for new subuser: ${uniqueEmail}`);

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
        console.log(`[INFO - createOrUpdateSubuser] New subuser created successfully. Subuser ID: ${subuser._id}.`);

        return res.status(201).json({ success: true, message: 'Tạo subuser thành công.', user: subuser });
    } catch (error) {
        console.error(`[CRITICAL ERROR - createOrUpdateSubuser] Caught exception: ${error.message}`);
        console.error(`Stack trace:`, error.stack);
        console.error(`Request body that caused error:`, req.body);
        console.error(`Full error object:`, error);

        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            console.warn(`[WARN - createOrUpdateSubuser] Duplicate email error detected during subuser creation/update. Email pattern: ${JSON.stringify(error.keyPattern)}`);
            return res.status(400).json({ success: false, message: 'Lỗi trùng lặp email. Vui lòng thử lại hoặc liên hệ hỗ trợ.' });
        }

        res.status(500).json({ success: false, message: 'Lỗi server khi xử lý subuser.', error: error.message });
    }
};

/**
 * @function deleteSubuser
 * @description Deletes a specific subuser.
 * @route DELETE /api/users/subuser/:subuserId
 * @access Private (only parent of the subuser or admin can delete)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - The URL parameters.
 * @param {string} req.params.subuserId - The ID of the subuser to delete.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status and message.
 * @throws {Error} - Throws an error if deletion fails (e.g., invalid ID, database error).
 */
exports.deleteSubuser = async (req, res) => {
    try {
        const { subuserId } = req.params;

        if (!subuserId || !mongoose.Types.ObjectId.isValid(subuserId)) {
            return res.status(400).json({ success: false, message: 'ID subuser không hợp lệ.' });
        }

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
 * @function loginSubuser
 * @description Handles login for a subuser account.
 * @route POST /api/users/login-subuser
 * @access Public
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with login data.
 * @param {string} req.body.numberphone - The subuser's phone number.
 * @param {string} req.body.password - The subuser's password (plaintext).
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status, message, token, and user details.
 * @throws {Error} - Throws an error if login fails (e.g., invalid credentials, database error).
 */
exports.loginSubuser = async (req, res) => {
    try {
        let { numberphone, password } = req.body;

        numberphone = normalizePhoneNumber(numberphone);

        if (!numberphone || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu số điện thoại hoặc mật khẩu.' });
        }

        const user = await User.findOne({ numberphone, role: 'subuser' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Số điện thoại hoặc mật khẩu sai.' });
        }

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
 * @function verifyPassword
 * @description Verifies a user's password.
 * @route POST /api/users/verify-password
 * @access Private (requires authentication)
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body with verification data.
 * @param {string} req.body.userId - The user's ID.
 * @param {string} req.body.password - The password to verify (plaintext).
 * @param {Object} res - The HTTP response object.
 * @returns {Object} - JSON response with success status and message.
 * @throws {Error} - Throws an error if verification fails (e.g., invalid ID, database error).
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