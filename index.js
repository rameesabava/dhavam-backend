// index.js
// Entry point for the Dhavam Spices backend (TiDB‑based)

require('dotenv').config();               // Load .env (DATABASE_URL, PORT, JWT_SECRET)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const allRoutes = require('./routes/allRoutes');
const jwtMiddleware = require('./middlewares/jwtMiddleware'); // protects routes that need auth

const app = express();

// Middleware stack
app.use(cors());
app.use(express.json());   // Parse JSON bodies
app.use(morgan('dev'));    // Simple request logger

// Public routes (register, login, get products) – no JWT needed
app.use('/', allRoutes);  // allRoutes already includes both public & protected routes
// Note: jwtMiddleware is applied inside individual route definitions where required

// Global error handler (fallback)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});