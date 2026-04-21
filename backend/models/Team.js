const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  contact: { type: String, required: true }
});

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: [true, 'Team name is required'] },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  leader: {
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true }
  },
  members: [teamMemberSchema],
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
