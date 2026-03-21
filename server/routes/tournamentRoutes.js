const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const { protect, authorize } = require('../middleware/authMiddleware');

const SPORTS = ['Cricket','Basketball','Volleyball','Football','Rugby','Hockey','Netball',
  'Table Tennis','Badminton','Tennis','Chess','Carrom','Swimming','Track & Field'];
const SPORT_TEAM_SIZES = {
  'Cricket':11,'Basketball':5,'Volleyball':6,'Football':11,'Rugby':15,
  'Hockey':11,'Netball':7,'Table Tennis':2,'Badminton':2,'Tennis':2,
  'Chess':1,'Carrom':2,'Swimming':1,'Track & Field':1
};
const INDIVIDUAL_SPORTS = ['Chess','Swimming','Track & Field'];

// IMPORTANT: Static routes MUST come before /:id dynamic routes

// @GET /api/tournaments/my/registrations - Student's own registrations
router.get('/my/registrations', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({ registeredBy: req.user._id })
      .populate('tournament', 'name sport startDate venue status');
    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tournaments/public - no auth needed for sponsor view
router.get('/public', async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: { $ne: 'cancelled' } })
      .populate('sponsors', 'name company').sort({ startDate: 1 });
    res.json({ success: true, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tournaments - all tournaments
router.get('/', protect, async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('createdBy', 'name')
      .populate('sponsors', 'name company')
      .sort({ startDate: 1 });
    res.json({ success: true, count: tournaments.length, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tournaments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'name').populate('sponsors', 'name company');
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tournaments - Admin/Coach only
router.post('/', protect, authorize('admin', 'coach'), [
  body('name').notEmpty().withMessage('Name required'),
  body('sport').isIn(SPORTS).withMessage('Invalid sport'),
  body('startDate').notEmpty().withMessage('Start date required'),
  body('endDate').notEmpty().withMessage('End date required'),
  body('registrationDeadline').notEmpty().withMessage('Registration deadline required'),
  body('venue').notEmpty().withMessage('Venue required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const sport = req.body.sport;
    const type = INDIVIDUAL_SPORTS.includes(sport) ? 'individual' : 'team';
    const requiredTeamSize = SPORT_TEAM_SIZES[sport] || 1;
    const tournament = await Tournament.create({ ...req.body, type, requiredTeamSize, createdBy: req.user._id });
    res.status(201).json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/tournaments/:id
router.put('/:id', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tournament) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/tournaments/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tournament deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tournaments/:id/registrations - Admin/Coach view
router.get('/:id/registrations', protect, authorize('admin', 'coach'), async (req, res) => {
  try {
    const registrations = await Registration.find({ tournament: req.params.id })
      .populate('registeredBy', 'name email studentId')
      .populate('team');
    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tournaments/:id/register - Student registers
router.post('/:id/register', protect, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

    if (new Date() > new Date(tournament.registrationDeadline))
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });

    if (tournament.currentParticipants >= tournament.maxParticipants)
      return res.status(400).json({ success: false, message: 'Tournament is full. Max participants reached' });

    if (tournament.type === 'individual') {
      const { studentName, studentId, contactNumber } = req.body;
      if (!studentName || !studentId || !contactNumber)
        return res.status(400).json({ success: false, message: 'Student name, ID and contact are required' });

      const duplicate = await Registration.findOne({ tournament: req.params.id, studentId });
      if (duplicate) return res.status(400).json({ success: false, message: 'You are already registered for this tournament' });

      const registration = await Registration.create({
        tournament: req.params.id, registeredBy: req.user._id,
        type: 'individual', studentName, studentId, contactNumber, sport: tournament.sport
      });
      tournament.currentParticipants += 1;
      await tournament.save();
      res.status(201).json({ success: true, message: 'Successfully registered!', registration });

    } else {
      const { teamName, leader, members } = req.body;
      if (!teamName || !leader || !members)
        return res.status(400).json({ success: false, message: 'Team name, leader and members are required' });

      const totalMembers = members.length + 1;
      if (totalMembers !== tournament.requiredTeamSize)
        return res.status(400).json({
          success: false,
          message: `${tournament.sport} requires exactly ${tournament.requiredTeamSize} players. You have ${totalMembers}`
        });

      const duplicate = await Registration.findOne({ tournament: req.params.id, registeredBy: req.user._id, type: 'team' });
      if (duplicate) return res.status(400).json({ success: false, message: 'You have already registered a team for this tournament' });

      const team = await Team.create({ teamName, tournament: req.params.id, leader, members, registeredBy: req.user._id });
      const registration = await Registration.create({
        tournament: req.params.id, registeredBy: req.user._id, type: 'team', team: team._id
      });
      tournament.currentParticipants += 1;
      await tournament.save();
      res.status(201).json({ success: true, message: 'Team registered successfully!', registration, team });
    }
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Duplicate registration detected' });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
