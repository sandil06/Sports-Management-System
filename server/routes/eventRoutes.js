const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/authMiddleware');

// @GET /api/events
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name').populate('sponsors', 'name').sort({ startDate: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/events/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name').populate('sponsors');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/events - Admin only
router.post('/', protect, authorize('admin', 'coach'), [
  body('title').notEmpty().withMessage('Title required'),
  body('startDate').notEmpty().withMessage('Start date required'),
  body('endDate').notEmpty().withMessage('End date required'),
  body('venue').notEmpty().withMessage('Venue required'),
  body('sport').notEmpty().withMessage('Sport type required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/events/:id
router.put('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/events/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
