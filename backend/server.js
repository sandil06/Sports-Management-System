const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',  require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => res.json({ message: 'User Management API running' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`User Management server running on port ${PORT}`));
