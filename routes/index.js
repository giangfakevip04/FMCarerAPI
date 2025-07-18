/**
 * @file index.js
 * @description Định nghĩa route gốc "/" cho trang chủ, sử dụng view engine EJS để render trang.
 */

const express = require('express');
const router = express.Router();

/**
 * @route GET /
 * @description Render trang chủ với tiêu đề "Express"
 * @param {express.Request} req - Đối tượng yêu cầu HTTP
 * @param {express.Response} res - Đối tượng phản hồi HTTP
 * @param {express.NextFunction} next - Middleware tiếp theo
 */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

module.exports = router;
