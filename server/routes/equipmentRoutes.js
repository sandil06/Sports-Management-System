const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const { CATEGORIES, LOCATIONS } = require('../models/Equipment');
const Reservation = require('../models/Reservation');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendLowStockAlert } = require('../utils/mailer');

// ─── GET /api/equipment/meta  (categories + locations for dropdowns) ───────────
router.get('/meta', protect, (req, res) => {
  res.json({ success: true, categories: CATEGORIES, locations: LOCATIONS });
});

// ─── GET /api/equipment  (with search + filter support) ───────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, condition, location } = req.query;
    const filter = {};

    if (search)    filter.name     = { $regex: search, $options: 'i' };
    if (category)  filter.category = category;
    if (condition) filter.condition = condition;
    if (location)  filter.location  = location;

    const equipment = await Equipment.find(filter).sort({ name: 1 });
    res.json({ success: true, count: equipment.length, equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/equipment  (Admin only) ────────────────────────────────────────
router.post('/', protect, authorize('admin'), [
  body('name')
    .notEmpty().withMessage('Equipment name is required')
    .trim(),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage('Invalid category'),
  body('totalQuantity')
    .isInt({ min: 0 }).withMessage('Total quantity must be a non-negative number'),
  body('availableQuantity')
    .isInt({ min: 0 }).withMessage('Available quantity must be a non-negative number')
    .custom((val, { req }) => {
      if (Number(val) > Number(req.body.totalQuantity)) {
        throw new Error('Available quantity cannot exceed total quantity');
      }
      return true;
    }),
  body('lowStockThreshold')
    .isInt({ min: 0 }).withMessage('Stock alert level must be a non-negative number')
    .custom((val, { req }) => {
      if (Number(req.body.totalQuantity) > 0 && Number(val) >= Number(req.body.totalQuantity)) {
        throw new Error('Stock alert level must be less than total quantity');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    // Duplicate check (case-insensitive)
    const existing = await Equipment.findOne({ name: { $regex: `^${req.body.name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Equipment "${req.body.name.trim()}" already exists. Use Edit to update it.`
      });
    }

    const equipment = await Equipment.create(req.body);

    // Send low stock alert if newly created equipment is already at/below threshold
    if (equipment.availableQuantity <= equipment.lowStockThreshold) {
      sendLowStockAlert(equipment).catch(err => console.error('Low stock email error:', err));
    }

    res.status(201).json({ success: true, equipment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An equipment with this name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/equipment/:id ───────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('totalQuantity').optional().isInt({ min: 0 }).withMessage('Total quantity must be non-negative'),
  body('availableQuantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Available quantity must be non-negative')
    .custom((val, { req }) => {
      if (req.body.totalQuantity !== undefined && Number(val) > Number(req.body.totalQuantity)) {
        throw new Error('Available quantity cannot exceed total quantity');
      }
      return true;
    }),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock alert level must be non-negative')
    .custom((val, { req }) => {
      if (req.body.totalQuantity !== undefined &&
          Number(req.body.totalQuantity) > 0 &&
          Number(val) >= Number(req.body.totalQuantity)) {
        throw new Error('Stock alert level must be less than total quantity');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    // Duplicate name check (excluding self)
    if (req.body.name) {
      const existing = await Equipment.findOne({
        name: { $regex: `^${req.body.name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Equipment "${req.body.name.trim()}" already exists.`
        });
      }
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });

    // Send low stock alert if updated stock is at/below threshold
    if (equipment.availableQuantity <= equipment.lowStockThreshold) {
      sendLowStockAlert(equipment).catch(err => console.error('Low stock email error:', err));
    }

    res.json({ success: true, equipment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An equipment with this name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE /api/equipment/:id ────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/equipment/reservations/all  (admin) ────────────────────────────
router.get('/reservations/all', protect, authorize('admin'), async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('equipment', 'name category')
      .populate('user', 'name email studentId')
      .sort({ createdAt: -1 });
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/equipment/reservations/my ──────────────────────────────────────
router.get('/reservations/my', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('equipment', 'name category condition');
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/equipment/:id/reserve ─────────────────────────────────────────
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

    const existingReservation = await Reservation.findOne({
      equipment: req.params.id,
      user: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    if (existingReservation)
      return res.status(400).json({ success: false, message: 'You already have an active request for this equipment' });

    const borrowDate = new Date(req.body.borrowDate);
    const returnDate = new Date(req.body.returnDate);
    if (returnDate < borrowDate)
      return res.status(400).json({ success: false, message: 'Return date cannot be earlier than borrow date' });

    equipment.availableQuantity -= req.body.quantity;
    await equipment.save();

    // Send low stock alert if stock dropped to/below threshold after reservation
    if (equipment.availableQuantity <= equipment.lowStockThreshold) {
      sendLowStockAlert(equipment).catch(err => console.error('Low stock email error:', err));
    }

    const reservation = await Reservation.create({ equipment: req.params.id, user: req.user._id, ...req.body });
    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/equipment/reservations/:id/approve  (admin) ────────────────────
router.put('/reservations/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment');
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    if (reservation.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Only pending reservations can be approved' });

    reservation.status = 'approved';
    await reservation.save();
    res.json({ success: true, message: 'Reservation approved', reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/equipment/reservations/:id/reject  (admin) ─────────────────────
router.put('/reservations/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment');
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    if (reservation.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Only pending reservations can be rejected' });

    // Restore the quantity back to equipment
    const equipment = await Equipment.findById(reservation.equipment._id);
    if (equipment) {
      equipment.availableQuantity += reservation.quantity;
      await equipment.save();
    }

    reservation.status = 'rejected';
    await reservation.save();
    res.json({ success: true, message: 'Reservation rejected', reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/equipment/reservations/:id/return ───────────────────────────────
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