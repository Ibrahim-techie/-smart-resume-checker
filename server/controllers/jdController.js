const axios = require('axios');
const JDMatch = require('../models/JDMatch');
const Resume = require('../models/Resume');

const getAiServiceUrl = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

const matchJD = async (req, res) => {
  const { resumeId, jdText, jdTitle } = req.body;

  if (!resumeId || !jdText) {
    return res.status(400).json({ message: 'resumeId and jdText are required' });
  }

  if (jdText.trim().length < 50) {
    return res.status(400).json({ message: 'Job description is too short' });
  }

  try {
    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (resume.status !== 'completed') {
      return res.status(400).json({
        message: 'Resume analysis not complete yet. Please wait and try again.',
      });
    }

    const normalizedTitle = jdTitle?.trim() || 'Untitled Position';
    const aiResponse = await axios.post(
      `${getAiServiceUrl()}/match`,
      { resumeId, jdText, jdTitle: normalizedTitle },
      { timeout: 30000 },
    );

    const result = aiResponse.data;

    const jdMatch = await JDMatch.create({
      user: req.user._id,
      resume: resumeId,
      jdTitle: normalizedTitle,
      jdText,
      matchScore: result.matchScore,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      matchedTech: result.matchedTech,
      missingTech: result.missingTech,
      matchedSoft: result.matchedSoft,
      missingSoft: result.missingSoft,
      suggestions: result.suggestions,
      jdKeywords: result.jdKeywords,
    });

    res.status(201).json({
      message: 'Match analysis complete',
      match: {
        _id: jdMatch._id,
        jdTitle: jdMatch.jdTitle,
        matchScore: jdMatch.matchScore,
        matchedKeywords: jdMatch.matchedKeywords,
        missingKeywords: jdMatch.missingKeywords,
        matchedTech: jdMatch.matchedTech,
        missingTech: jdMatch.missingTech,
        matchedSoft: jdMatch.matchedSoft,
        missingSoft: jdMatch.missingSoft,
        suggestions: jdMatch.suggestions,
        createdAt: jdMatch.createdAt,
      },
    });
  } catch (error) {
    if (error.response?.data?.error) {
      return res.status(400).json({ message: error.response.data.error });
    }
    res.status(500).json({ message: error.message });
  }
};

const getMatchHistory = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const matches = await JDMatch.find({
      user: req.user._id,
      resume: req.params.resumeId,
    })
      .sort({ createdAt: -1 })
      .select('-jdText -jdKeywords');

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMatchById = async (req, res) => {
  try {
    const match = await JDMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const match = await JDMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await match.deleteOne();
    res.json({ message: 'Match deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { matchJD, getMatchHistory, getMatchById, deleteMatch };
