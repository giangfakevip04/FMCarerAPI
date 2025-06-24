const express = require('express');
const router = express.Router();
const {
    addChild,
    getChildren,
    updateChild,
    deleteChild
} = require('../controllers/childController');

const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // tất cả yêu cầu đều phải đăng nhập

router.post('/', addChild);
router.get('/', getChildren);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);

module.exports = router;
