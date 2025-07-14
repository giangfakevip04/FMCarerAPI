// 👉 childRoutes.js
const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { requireAuth } = require('../middlewares/auth');

/**
 * Định tuyến cho các chức năng quản lý trẻ em.
 * Base path: /api/children
 * Yêu cầu xác thực qua middleware `requireAuth`.
 */

// ✅ Tạo trẻ mới
router.post('/', requireAuth, childController.createChild);

// ✅ Lấy danh sách trẻ theo user
router.get('/my', requireAuth, childController.getChildrenByUser);

// ✅ Lấy chi tiết trẻ
router.get('/:childId', requireAuth, childController.getChildById);

// ✅ Cập nhật trẻ
router.put('/:childId', requireAuth, childController.updateChild);

// ✅ Xoá trẻ
router.delete('/:childId', requireAuth, childController.deleteChild);

module.exports = router;
