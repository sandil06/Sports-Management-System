const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('studentId').notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, studentId, role, phone, department } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists with this email or student ID' });

    const user = await User.create({ name, email, password, studentId, role: role || 'student', phone, department });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;

// @POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });
    // In production you would send an email. For demo we return a reset token.
    const resetToken = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ success: true, message: 'Password reset token generated (demo mode)', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') return res.status(400).json({ success: false, message: 'Invalid token' });
    const user = await User.findById(decoded.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Token expired or invalid' });
  }
});
