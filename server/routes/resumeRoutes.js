const express = require('express');
const { protect, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadResume, getMyResumes, deleteResume, getResumeById } = require('../controllers/resumeController');

const router = express.Router();

const handleUpload = (req, res, next) => {
  upload.single('resume')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must be 5MB or less' });
    }

    return res.status(400).json({ message: error.message || 'Resume upload failed' });
  });
};

router.use(protect);
router.use(authorizeRole('jobseeker'));

router.post('/upload', handleUpload, uploadResume);
router.get('/my-resumes', getMyResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

module.exports = router;
