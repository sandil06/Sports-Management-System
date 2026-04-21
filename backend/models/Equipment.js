const mongoose = require('mongoose');

const CATEGORIES = [
  'Sports Equipment',
  'Training Equipment',
  'Medical Equipment',
  'Ball Sports',
  'Racket Sports',
  'Cricket',
  'Athletics',
  'Swimming',
  'Fitness',
  'Other'
];

const LOCATIONS = [
  'Store Room A',
  'Store Room B',
  'Ground Storage',
  'Main Hall',
  'Indoor Court',
  'Outdoor Field',
  'Swimming Pool Area',
  'Gym Storage'
];

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    unique: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: CATEGORIES,
    index: true
  },
  description: { type: String },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good',
    index: true
  },
  lowStockThreshold: {
    type: Number,
    default: 3,
    min: [0, 'Stock alert level cannot be negative']
  },
  location: {
    type: String,
    default: ''
  }
}, { timestamps: true });

equipmentSchema.virtual('isLowStock').get(function () {
  return this.availableQuantity <= this.lowStockThreshold;
});

equipmentSchema.pre('save', function (next) {
  if (this.availableQuantity > this.totalQuantity) {
    return next(new Error('Available quantity cannot exceed total quantity'));
  }
  if (this.totalQuantity > 0 && this.lowStockThreshold >= this.totalQuantity) {
    return next(new Error('Stock alert level must be less than total quantity'));
  }
  next();
});

equipmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.LOCATIONS = LOCATIONS;