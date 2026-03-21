const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/authMiddleware');

// @GET /api/equipment
router.get('/', protect, async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ name: 1 });
    res.json({ success: true, count: equipment.length, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/equipment - Admin only
router.post('/', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Name required'),
  body('category').notEmpty().withMessage('Category required'),
  body('totalQuantity').isNumeric().withMessage('Total quantity must be a number'),
  body('availableQuantity').isNumeric().withMessage('Available quantity must be a number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/equipment/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/equipment/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/equipment/reservations - get all reservations (admin)
router.get('/reservations/all', protect, authorize('admin'), async (req, res) => {
  try {
    const reservations = await Reservation.find().populate('equipment', 'name category').populate('user', 'name email studentId').sort({ createdAt: -1 });
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/equipment/reservations/my - student's own reservations
router.get('/reservations/my', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).populate('equipment', 'name category condition');
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/equipment/:id/reserve - Student reserves
router.post('/:id/reserve', protect, [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('borrowDate').notEmpty().withMessage('Borrow date required'),
  body('returnDate').notEmpty().withMessage('Return date required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    if (equipment.availableQuantity < req.body.quantity)
      return res.status(400).json({ success: false, message: 'Not enough stock available' });

    equipment.availableQuantity -= req.body.quantity;
    await equipment.save();

    const reservation = await Reservation.create({ equipment: req.params.id, user: req.user._id, ...req.body });
    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/equipment/reservations/:id/return
router.put('/reservations/:id/return', protect, authorize('admin'), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment');
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    reservation.status = 'returned';
    reservation.actualReturnDate = Date.now();
    await reservation.save();

    const equipment = await Equipment.findById(reservation.equipment._id);
    equipment.availableQuantity += reservation.quantity;
    await equipment.save();

    res.json({ success: true, message: 'Equipment returned', reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
