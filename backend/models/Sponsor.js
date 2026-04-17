const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sponsorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  company: { type: String, required: [true, 'Company name is required'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String },
  website: { type: String },
  sponsoredTournaments: [{
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    amount: { type: Number, default: 0 },
    sponsorshipName: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    paymentIntentId: { type: String },
  }],
  totalContribution: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

sponsorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

sponsorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Sponsor', sponsorSchema);
