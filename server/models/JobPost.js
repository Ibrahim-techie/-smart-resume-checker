const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  company: {
    type: String,
    trim: true,
    default: '',
  },
  location: {
    type: String,
    trim: true,
    default: 'Remote',
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  requiredSkills: {
    type: [String],
    default: [],
  },
  experienceLevel: {
    type: String,
    enum: ['Internship', 'Entry Level', 'Mid Level', 'Senior', 'Lead'],
    default: 'Entry Level',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastRankedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('JobPost', jobPostSchema);
