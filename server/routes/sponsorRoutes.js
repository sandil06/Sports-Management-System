const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Sponsor = require('../models/Sponsor');
const Tournament = require('../models/Tournament');
const { protect, authorize } = require('../middleware/authMiddleware');

const generateToken = (id, type) => jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const protectSponsor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'sponsor') return res.status(403).json({ success: false, message: 'Not a sponsor account' });
    req.sponsor = await Sponsor.findById(decoded.id);
    if (!req.sponsor) return res.status(401).json({ success: false, message: 'Sponsor not found' });
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

// Register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('company').notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const exists = await Sponsor.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const sponsor = await Sponsor.create(req.body);
    const token = generateToken(sponsor._id, 'sponsor');
    res.status(201).json({ success: true, token, sponsor: { id: sponsor._id, name: sponsor.name, company: sponsor.company, email: sponsor.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const sponsor = await Sponsor.findOne({ email: req.body.email }).select('+password');
    if (!sponsor || !(await sponsor.matchPassword(req.body.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!sponsor.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const token = generateToken(sponsor._id, 'sponsor');
    res.json({ success: true, token, sponsor: { id: sponsor._id, name: sponsor.name, company: sponsor.company, email: sponsor.email, totalContribution: sponsor.totalContribution, sponsoredTournaments: sponsor.sponsoredTournaments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my profile
router.get('/me', protectSponsor, async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.sponsor._id).populate('sponsoredTournaments.tournament', 'name sport startDate venue');
    res.json({ success: true, sponsor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// View tournaments (for sponsor)
router.get('/tournaments', protectSponsor, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: { $ne: 'cancelled' } }).sort({ startDate: 1 });
    res.json({ success: true, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply to sponsor a tournament
router.post('/sponsor-event', protectSponsor, [
  body('tournamentId').notEmpty().withMessage('Tournament required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('sponsorshipName').notEmpty().withMessage('Sponsorship name required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { tournamentId, amount, sponsorshipName } = req.body;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    const alreadyApplied = req.sponsor.sponsoredTournaments.find(
      s => s.tournament.toString() === tournamentId
    );
    if (alreadyApplied) return res.status(400).json({ success: false, message: 'You already applied to sponsor this tournament' });

    req.sponsor.sponsoredTournaments.push({
      tournament: tournamentId, amount, sponsorshipName,
      status: 'pending', appliedAt: new Date()
    });
    await req.sponsor.save();
    res.json({ success: true, message: 'Sponsorship application submitted! Waiting for admin approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get all sponsors
router.get('/list', protect, authorize('admin'), async (req, res) => {
  try {
    const sponsors = await Sponsor.find().select('-password')
      .populate('sponsoredTournaments.tournament', 'name sport').sort({ createdAt: -1 });
    res.json({ success: true, sponsors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: approve or reject sponsorship
router.put('/approve/:sponsorId/:tournamentId', protect, authorize('admin'), async (req, res) => {
  try {
    const { sponsorId, tournamentId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) return res.status(404).json({ success: false, message: 'Sponsor not found' });

    const entry = sponsor.sponsoredTournaments.find(s => s.tournament.toString() === tournamentId);
    if (!entry) return res.status(404).json({ success: false, message: 'Sponsorship not found' });

    entry.status = status;
    entry.reviewedAt = new Date();

    if (status === 'approved') {
      sponsor.totalContribution += entry.amount;
      // Add sponsor to tournament
      const tournament = await Tournament.findById(tournamentId);
      if (tournament && !tournament.sponsors.includes(sponsorId)) {
        tournament.sponsors.push(sponsorId);
        await tournament.save();
      }
    }

    await sponsor.save();
    res.json({ success: true, message: `Sponsorship ${status}`, sponsor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot password - send reset (simplified: just update password directly)
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const sponsor = await Sponsor.findOne({ email: req.body.email });
    if (!sponsor) return res.status(404).json({ success: false, message: 'No sponsor account found with this email' });
    res.json({ success: true, message: 'If this email exists, a reset link would be sent. For demo: use the reset endpoint.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.protectSponsor = protectSponsor;
