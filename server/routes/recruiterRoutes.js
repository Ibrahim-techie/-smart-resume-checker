const express = require('express');
const { protect, authorizeRole } = require('../middleware/authMiddleware');
const {
  createJob,
  getMyJobs,
  updateJob,
  deleteJob,
  getCandidates,
  rankCandidates,
  getStats,
} = require('../controllers/recruiterController');

const router = express.Router();

router.use(protect);
router.use(authorizeRole('recruiter'));

router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.get('/candidates', getCandidates);
router.post('/rank', rankCandidates);
router.get('/stats', getStats);

module.exports = router;
