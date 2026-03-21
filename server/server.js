const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));

app.get('/', (req, res) => res.json({ message: 'Item Management API running' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Item Management server running on port ${PORT}`));
