const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const Resume = require('../models/Resume');

const triggerExtraction = async (resumeId, fileUrl, fileType) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  try {
    await axios.post(`${aiServiceUrl}/extract`, {
      resumeId,
      fileUrl,
      fileType,
    }, { timeout: 60000 });
  } catch (err) {
    console.error(`[AI Service] Extraction failed for ${resumeId}:`, err.message);
  }
};

const createSignedDownloadUrl = (publicId, originalName) => {
  const format = path.extname(originalName).toLowerCase().replace('.', '');

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: 'raw',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
  });
};

const uploadToCloudinary = (buffer, originalName, mimetype) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    const publicId = `resumes/${uuidv4()}_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        format: ext,
        folder: 'smart-resume-checker',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

const getFileType = (originalName, mimetype) => {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf' || mimetype === 'application/pdf') {
    return 'pdf';
  }

  return 'docx';
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const existing = await Resume.findOne({ user: req.user._id, fileHash });
    if (existing) {
      return res.status(409).json({
        message: 'You have already uploaded this exact resume.',
        resumeId: existing._id,
      });
    }

    const cloudResult = await uploadToCloudinary(buffer, originalname, mimetype);
    const fileType = getFileType(originalname, mimetype);

    const resume = await Resume.create({
      user: req.user._id,
      originalName: originalname,
      fileType,
      fileSize: size,
      fileUrl: cloudResult.secure_url,
      publicId: cloudResult.public_id,
      fileHash,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Resume uploaded successfully. Analysis will begin shortly.',
      resume: {
        _id: resume._id,
        originalName: resume.originalName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        status: resume.status,
        uploadedAt: resume.uploadedAt,
        atsScore: resume.atsScore,
      },
    });

    triggerExtraction(
      resume._id.toString(),
      createSignedDownloadUrl(resume.publicId, resume.originalName),
      resume.fileType,
    );
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ uploadedAt: -1 })
      .select('-parsedText -fileHash -publicId');

    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    try {
      await cloudinary.uploader.destroy(resume.publicId, { resource_type: 'raw' });
    } catch (cloudErr) {
      console.warn('Cloudinary delete warning:', cloudErr.message);
    }

    await resume.deleteOne();
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).select('-fileHash -publicId');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadResume, getMyResumes, deleteResume, getResumeById };
