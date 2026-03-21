const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Equipment name is required'] },
  category: { type: String, required: [true, 'Category is required'] },
  description: { type: String },
  totalQuantity: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  lowStockThreshold: { type: Number, default: 3 },
  location: { type: String }
}, { timestamps: true });

equipmentSchema.virtual('isLowStock').get(function () {
  return this.availableQuantity <= this.lowStockThreshold;
});

equipmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
