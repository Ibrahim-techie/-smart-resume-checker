const express = require('express');
const { protect, authorizeRole } = require('../middleware/authMiddleware');
const { getSuggestions, clearSuggestions } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);
router.use(authorizeRole('jobseeker'));

router.post('/suggest', getSuggestions);
router.delete('/suggest/:resumeId', clearSuggestions);

module.exports = router;
