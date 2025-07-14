const express = require('express');
const {
    getDiaryEntries,
    getDiaryEntry,
    createDiaryEntry,
    updateDiaryEntry,
    deleteDiaryEntry
} = require('../controllers/diaryEntryController');

const router = express.Router();

/**
 * Định tuyến cho chức năng nhật ký hoạt động (diary entries).
 * Base path: /api/diaryentries
 */

// ✅ Lấy toàn bộ nhật ký hoặc theo child/user
router.route('/')
    .get(getDiaryEntries)         // GET /api/diaryentries
    .post(createDiaryEntry);     // POST /api/diaryentries

// ✅ Thao tác trên 1 nhật ký cụ thể
router.route('/:id')
    .get(getDiaryEntry)          // GET /api/diaryentries/:id
    .put(updateDiaryEntry)       // PUT /api/diaryentries/:id
    .delete(deleteDiaryEntry);   // DELETE /api/diaryentries/:id

module.exports = router;
