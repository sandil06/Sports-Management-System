const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  purpose: { type: String },
  teamName: { type: String },
  numberOfPlayers: { type: Number },
  status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
