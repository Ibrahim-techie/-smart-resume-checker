const axios = require('axios');
const JobPost = require('../models/JobPost');
const Resume = require('../models/Resume');

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  return [...new Set(skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean))];
};

const createJob = async (req, res) => {
  const { title, company, location, description, requiredSkills, experienceLevel } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const job = await JobPost.create({
      recruiter: req.user._id,
      title,
      company: company || '',
      location: location || 'Remote',
      description,
      requiredSkills: normalizeSkills(requiredSkills),
      experienceLevel: experienceLevel || 'Entry Level',
    });

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, company, location, description, requiredSkills, experienceLevel, isActive } = req.body;

    if (title !== undefined) job.title = title;
    if (company !== undefined) job.company = company;
    if (location !== undefined) job.location = location || 'Remote';
    if (description !== undefined) job.description = description;
    if (requiredSkills !== undefined) job.requiredSkills = normalizeSkills(requiredSkills);
    if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
    if (isActive !== undefined) job.isActive = isActive;

    await job.save();
    res.json({ message: 'Job updated', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCandidates = async (req, res) => {
  try {
    const resumes = await Resume.find({ status: 'completed' })
      .populate('user', 'name email createdAt')
      .sort({ atsScore: -1 })
      .select('-parsedText -fileHash -publicId -fileUrl -filePath -analysisResult');

    const seen = new Set();
    const candidates = [];

    for (const resume of resumes) {
      if (!resume.user) continue;
      const userId = resume.user._id.toString();
      if (seen.has(userId)) continue;

      seen.add(userId);
      candidates.push({
        userId: resume.user._id,
        name: resume.user.name,
        email: resume.user.email,
        joinedAt: resume.user.createdAt,
        resumeId: resume._id,
        resumeName: resume.originalName,
        atsScore: resume.atsScore,
        fileType: resume.fileType,
        uploadedAt: resume.uploadedAt,
        matchScore: null,
        matchedKeywords: [],
        missingKeywords: [],
      });
    }

    res.json({ candidates, total: candidates.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rankCandidates = async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({ message: 'jobId is required' });
  }

  try {
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const resumes = await Resume.find({ status: 'completed' })
      .populate('user', 'name email')
      .select('parsedText atsScore originalName fileType user uploadedAt');

    if (resumes.length === 0) {
      return res.json({ ranked: [], total: 0, jobTitle: job.title });
    }

    const matchPromises = resumes.map(async (resume) => {
      if (!resume.user || !resume.parsedText) return null;

      try {
        const response = await axios.post(
          `${getAiServiceUrl()}/match`,
          {
            resumeId: resume._id.toString(),
            jdText: job.description,
            jdTitle: job.title,
          },
          { timeout: 15000 },
        );

        return {
          userId: resume.user._id,
          name: resume.user.name,
          resumeId: resume._id,
          resumeName: resume.originalName,
          atsScore: resume.atsScore,
          matchScore: response.data.matchScore,
          matchedKeywords: response.data.matchedKeywords || [],
          missingKeywords: response.data.missingKeywords || [],
          matchedTech: response.data.matchedTech || [],
          suggestions: response.data.suggestions || [],
          uploadedAt: resume.uploadedAt,
        };
      } catch (error) {
        return {
          userId: resume.user._id,
          name: resume.user.name,
          resumeId: resume._id,
          resumeName: resume.originalName,
          atsScore: resume.atsScore,
          matchScore: null,
          matchedKeywords: [],
          missingKeywords: [],
          matchedTech: [],
          suggestions: [],
          uploadedAt: resume.uploadedAt,
        };
      }
    });

    const results = (await Promise.all(matchPromises)).filter(Boolean);
    const userMap = new Map();

    for (const result of results) {
      const key = result.userId.toString();
      const existing = userMap.get(key);
      if (!existing || (result.matchScore ?? 0) > (existing.matchScore ?? 0)) {
        userMap.set(key, result);
      }
    }

    const ranked = Array.from(userMap.values()).sort((a, b) => {
      const matchDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
      if (matchDiff !== 0) return matchDiff;
      return (b.atsScore ?? 0) - (a.atsScore ?? 0);
    });

    job.lastRankedAt = new Date();
    await job.save();

    res.json({
      ranked,
      total: ranked.length,
      jobTitle: job.title,
      rankedAt: job.lastRankedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalJobs = await JobPost.countDocuments({ recruiter: req.user._id });
    const activeJobs = await JobPost.countDocuments({ recruiter: req.user._id, isActive: true });
    const totalCandidates = await Resume.distinct('user', { status: 'completed' });
    const avgAtsResult = await Resume.aggregate([
      { $match: { status: 'completed', atsScore: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$atsScore' } } },
    ]);

    res.json({
      totalJobs,
      activeJobs,
      totalCandidates: totalCandidates.length,
      avgAtsScore: avgAtsResult[0]?.avg ? Math.round(avgAtsResult[0].avg) : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJob,
  getMyJobs,
  updateJob,
  deleteJob,
  getCandidates,
  rankCandidates,
  getStats,
};
