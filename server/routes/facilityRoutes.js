const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/authMiddleware');

// @GET /api/facilities
router.get('/', protect, async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ name: 1 });
    res.json({ success: true, facilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/facilities - Admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json({ success: true, facility });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/facilities/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found' });
    res.json({ success: true, facility });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/facilities/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Facility deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/facilities/:id/availability?date=YYYY-MM-DD
router.get('/:id/availability', protect, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date query param required' });
    const bookings = await Booking.find({ facility: req.params.id, date, status: 'confirmed' })
      .populate('user', 'name studentId').select('startTime endTime user purpose teamName');
    res.json({ success: true, date, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/facilities/bookings/my
router.get('/bookings/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('facility', 'name type sport').sort({ date: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/facilities/bookings/all - Admin
router.get('/bookings/all', protect, authorize('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('facility', 'name type').populate('user', 'name email studentId').sort({ date: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/facilities/:id/book
router.post('/:id/book', protect, [
  body('date').notEmpty().withMessage('Date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('purpose').notEmpty().withMessage('Purpose is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { date, startTime, endTime, purpose, teamName, numberOfPlayers } = req.body;
  try {
    // Double booking prevention
    const conflict = await Booking.findOne({
      facility: req.params.id, date, status: 'confirmed',
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });
    if (conflict)
      return res.status(400).json({ success: false, message: `This facility is already booked from ${conflict.startTime} to ${conflict.endTime} on ${date}` });

    if (startTime >= endTime)
      return res.status(400).json({ success: false, message: 'End time must be after start time' });

    const booking = await Booking.create({
      facility: req.params.id, user: req.user._id, date, startTime, endTime, purpose, teamName, numberOfPlayers
    });
    await booking.populate('facility', 'name sport');
    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/facilities/bookings/:id/cancel
router.put('/bookings/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
