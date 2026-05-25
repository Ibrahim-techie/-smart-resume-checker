const express = require('express');
const { protect, authorizeRole } = require('../middleware/authMiddleware');
const {
  matchJD,
  getMatchHistory,
  getMatchById,
  deleteMatch,
} = require('../controllers/jdController');

const router = express.Router();

router.use(protect);
router.use(authorizeRole('jobseeker'));

router.post('/match', matchJD);
router.get('/history/:resumeId', getMatchHistory);
router.get('/:id', getMatchById);
router.delete('/:id', deleteMatch);

module.exports = router;
