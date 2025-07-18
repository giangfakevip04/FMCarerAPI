/**
 * @fileoverview Controller xử lý các chức năng nạp tiền qua Momo.
 * @module controllers/paymentController
 */

const Payment = require('../models/Payment');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment');

// --- Cấu hình Momo (cần khai báo trong .env) ---
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER_CODE';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY';
const MOMO_RETURN_URL = process.env.MOMO_RETURN_URL || 'YOUR_APP_FRONTEND_URL/payment-status';
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || 'YOUR_APP_BACKEND_URL/api/payments/momo-ipn';

/**
 * Gửi yêu cầu thanh toán đến Momo API (giả lập)
 * @async
 * @param {string} orderId - Mã đơn hàng nội bộ
 * @param {number} amount - Số tiền cần thanh toán
 * @param {string} userId - ID người dùng
 * @param {string} orderInfo - Thông tin đơn hàng
 * @param {string} redirectUrl - URL frontend để chuyển hướng sau khi thanh toán
 * @param {string} ipnUrl - URL backend nhận thông báo IPN từ Momo
 * @returns {Promise<Object>} - Phản hồi từ Momo (giả lập)
 */
const callMomoApi = async (orderId, amount, userId, orderInfo, redirectUrl, ipnUrl) => {
    const requestId = uuidv4();
    const extraData = '';
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}`;
    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

    return new Promise(resolve => {
        setTimeout(() => {
            const success = Math.random() > 0.05;
            if (success) {
                resolve({
                    payUrl: `https://mock-momo.com/pay?orderId=${orderId}&amount=${amount}&signature=${signature}&requestId=${requestId}`,
                    deeplink: `momo://?action=pay&data=${orderId}`,
                    qrCodeUrl: `https://mock-momo.com/qr/${orderId}.png`,
                    requestId,
                    orderId,
                    message: "Success",
                    resultCode: 0,
                    rawResponse: {}
                });
            } else {
                resolve({
                    resultCode: 1001,
                    message: "Momo processing failed, please try again.",
                    rawResponse: {}
                });
            }
        }, 1500);
    });
};

/**
 * Khởi tạo yêu cầu nạp tiền mới qua Momo
 * @function
 * @async
 * @route POST /api/payments/topup/initiate
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Thông tin thanh toán hoặc lỗi
 */
exports.initiateTopUp = async (req, res) => {
    const { amount, payment_method } = req.body;
    const user_id = req.user._id;
    const username = req.user.username;

    if (!amount || amount <= 0 || !payment_method) {
        console.error('Validation Error: Missing required fields for initiateTopUp.', { amount, payment_method, user_id });
        return res.status(400).json({ message: 'Missing required fields: amount or payment_method.' });
    }
    if (payment_method !== 'Momo') {
        console.error('Validation Error: Invalid payment method for initiateTopUp.', { payment_method, user_id });
        return res.status(400).json({ message: 'Invalid payment method. Only Momo is supported for now.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderId = `PAY_${uuidv4()}`;
        const orderInfo = `Nạp tiền vào tài khoản ${username || user_id} - ${orderId}`;

        const newPayment = new Payment({
            user_id,
            amount,
            currency: 'VND',
            payment_method: 'Momo',
            transaction_id: orderId,
            order_info: orderInfo,
            status: 'Pending',
            payment_date: new Date()
        });

        await newPayment.save({ session });
        console.log('Payment record created with Pending status:', newPayment._id);

        const gatewayResponse = await callMomoApi(orderId, amount, user_id.toString(), orderInfo, MOMO_RETURN_URL, MOMO_IPN_URL);

        if (gatewayResponse.resultCode === 0) {
            newPayment.gateway_transaction_id = gatewayResponse.requestId;
            newPayment.pay_url = gatewayResponse.payUrl;
            newPayment.raw_gateway_response = gatewayResponse;
            await newPayment.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ message: 'Momo payment initiated successfully.', payment: newPayment, payUrl: newPayment.pay_url });
        } else {
            newPayment.status = 'Failed';
            newPayment.failed_reason = gatewayResponse.message || 'Momo initiation failed.';
            newPayment.raw_gateway_response = gatewayResponse;
            await newPayment.save({ session });
            await session.commitTransaction();
            return res.status(400).json({ message: 'Momo payment initiation failed.', error: newPayment.failed_reason, payment: newPayment });
        }
    } catch (error) {
        await session.abortTransaction();
        console.error('Error during payment initiation:', error.message, error.stack);
        return res.status(500).json({ message: 'Server error during payment process.', error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Xử lý IPN từ Momo
 * @function
 * @async
 * @route POST /api/payments/momo-ipn
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.momoIPN = async (req, res) => {
    const { orderId, requestId, amount, resultCode, message, transId, signature } = req.body;
    console.log('Received Momo IPN:', req.body);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const payment = await Payment.findOne({ transaction_id: orderId, gateway_transaction_id: requestId }).session(session);

        if (!payment) {
            console.warn('Momo IPN: Payment not found for orderId/requestId.', { orderId, requestId });
            await session.abortTransaction();
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        if (payment.status === 'Completed') {
            await session.commitTransaction();
            return res.status(200).json({ message: 'Payment already processed.' });
        }

        if (resultCode === 0) {
            payment.status = 'Completed';
            payment.completed_at = new Date();
            payment.gateway_transaction_id = transId;
            payment.raw_gateway_response = req.body;
            await payment.save({ session });

            const user = await User.findById(payment.user_id).session(session);
            if (!user) {
                throw new Error('User not found during Momo IPN processing.');
            }
            user.balance = (user.balance || 0) + payment.amount;
            await user.save({ session });
        } else {
            payment.status = 'Failed';
            payment.failed_reason = message || `Momo failed with result code: ${resultCode}`;
            payment.raw_gateway_response = req.body;
            await payment.save({ session });
        }

        await session.commitTransaction();
        return res.status(200).json({ message: 'Momo IPN processed successfully.' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error processing Momo IPN:', error.message, error.stack);
        return res.status(500).json({ message: 'Server error processing Momo IPN.', error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Lấy lịch sử nạp tiền của người dùng
 * @function
 * @async
 * @route GET /api/payments/topup/history
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTopUpHistory = async (req, res) => {
    const user_id = req.user._id;
    const { limit = 10, skip = 0 } = req.query;

    try {
        const payments = await Payment.find({ user_id, payment_method: 'Momo' })
            .sort({ payment_date: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const totalPayments = await Payment.countDocuments({ user_id, payment_method: 'Momo' });

        return res.status(200).json({
            total: totalPayments,
            limit: parseInt(limit),
            skip: parseInt(skip),
            data: payments
        });
    } catch (error) {
        console.error('Error fetching Momo top-up history:', error.message, error.stack);
        return res.status(500).json({ message: 'Server error fetching top-up history.', error: error.message });
    }
};

/**
 * Lấy chi tiết giao dịch nạp tiền Momo theo ID
 * @function
 * @async
 * @route GET /api/payments/topup/:id
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPaymentById = async (req, res) => {
    const paymentId = req.params.id;
    const user_id = req.user._id;

    try {
        const payment = await Payment.findOne({ _id: paymentId, user_id, payment_method: 'Momo' });

        if (!payment) {
            return res.status(404).json({ message: 'Momo Payment not found or you do not have access to it.' });
        }

        return res.status(200).json(payment);
    } catch (error) {
        console.error('Error fetching Momo payment by ID:', error.message, error.stack);
        return res.status(500).json({ message: 'Server error fetching payment details.', error: error.message });
    }
};
