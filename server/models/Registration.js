const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['individual', 'team'], required: true },
  // Individual fields
  studentName: { type: String },
  studentId: { type: String },
  contactNumber: { type: String },
  sport: { type: String },
  // Team fields
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Prevent duplicate registration
registrationSchema.index({ tournament: 1, studentId: 1 }, { unique: true, sparse: true });
registrationSchema.index({ tournament: 1, registeredBy: 1, type: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
