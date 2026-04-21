const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  description: { type: String },
  eventType: { type: String, enum: ['tournament', 'match', 'training', 'other'], default: 'tournament' },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  venue: { type: String, required: [true, 'Venue is required'] },
  sport: { type: String, required: [true, 'Sport type is required'] },
  maxTeams: { type: Number, default: 8 },
  registrationFee: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sponsors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }],
  results: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
