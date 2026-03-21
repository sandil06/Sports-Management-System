const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Facility name is required'] },
  type: { type: String, enum: ['court', 'field', 'pool', 'gym', 'track', 'other'], required: true },
  sport: { type: String, required: true },
  capacity: { type: Number },
  description: { type: String },
  amenities: [String],
  isAvailable: { type: Boolean, default: true },
  location: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Facility', facilitySchema);
