const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx'],
    required: true,
  },
  fileSize: {
    type: Number,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
  },
  parsedText: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  analysisStartedAt: {
    type: Date,
    default: null,
  },
  analysisCompletedAt: {
    type: Date,
    default: null,
  },
  atsScore: {
    type: Number,
    default: null,
  },
  analysisResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  geminiSuggestions: {
    type: [String],
    default: null,
  },
  lastSuggestedAt: {
    type: Date,
    default: null,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

resumeSchema.index({ user: 1, fileHash: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
