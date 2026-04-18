const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/facilities', require('./routes/facilityRoutes'));
app.use('/api/sponsors', require('./routes/sponsorRoutes'));
app.use('/api/tournaments', require('./routes/tournamentRoutes'));

app.get('/', (req, res) => res.json({ message: 'SliitArena 360 API running' }));

// ── Test route: send a low stock alert email immediately ─────────────────────
// Visit http://localhost:5000/test-low-stock in your browser to test
app.get('/test-low-stock', async (req, res) => {
  const { sendLowStockAlert } = require('./utils/mailer');
  try {
    await sendLowStockAlert({
      equipmentName: 'Cricket Bat',
      availableQuantity: 2,
      lowStockThreshold: 5,
      category: 'Cricket',
      location: 'Store Room A',
    });
    res.json({ success: true, message: `Low stock alert email sent to ${process.env.ADMIN_EMAIL}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SliitArena 360 server running on port ${PORT}`));