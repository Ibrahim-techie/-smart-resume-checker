const mongoose = require('mongoose');

const jdMatchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  jdTitle: {
    type: String,
    default: 'Untitled Position',
    trim: true,
  },
  jdText: {
    type: String,
    required: true,
  },
  matchScore: {
    type: Number,
    default: null,
  },
  matchedKeywords: [String],
  missingKeywords: [String],
  matchedTech: [String],
  missingTech: [String],
  matchedSoft: [String],
  missingSoft: [String],
  suggestions: [String],
  jdKeywords: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

jdMatchSchema.index({ user: 1, resume: 1, createdAt: -1 });

module.exports = mongoose.model('JDMatch', jdMatchSchema);
