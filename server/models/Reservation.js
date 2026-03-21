const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true, min: 1 },
  borrowDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  actualReturnDate: { type: Date },
  purpose: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'returned', 'overdue', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
