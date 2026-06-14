require('dotenv').config();
const express = require('express');
const cors = require('cors');
const danaRoutes = require('./routes/dana');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS – allow the React frontend
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// Raw body for webhook signature verification (must come before json parser)
app.use('/api/dana/webhook', express.raw({ type: 'application/json' }));

// JSON body for all other routes
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.DANA_ENV || 'sandbox' });
});

// DANA payment routes
app.use('/api/dana', danaRoutes);

app.listen(PORT, () => {
  console.log(`POSS server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.DANA_ENV || 'sandbox'}`);
});
