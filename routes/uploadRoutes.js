/**
 * Định tuyến xử lý upload ảnh (đơn và nhiều ảnh).
 * Base path: /api/upload
 */

const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const path = require('path');

/**
 * @route POST /api/upload-multiple
 * @desc Upload nhiều ảnh cùng lúc (tối đa 10 file)
 * @access Public
 */
router.post('/upload-multiple', upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No files uploaded',
            imageUrls: []
        });
    }

    const imageUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
    res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        imageUrls
    });
});

/**
 * @route POST /api/upload
 * @desc Upload một ảnh đơn
 * @access Public
 */
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded',
            imageUrl: null
        });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl
    });
});

module.exports = router;
