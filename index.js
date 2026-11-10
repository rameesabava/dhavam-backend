// index.js
// Entry point for the Dhavam Spices backend (TiDB‑based)

require('dotenv').config();               // Load .env (DATABASE_URL, PORT, JWT_SECRET)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const allRoutes = require('./routes/allRoutes');
const jwtMiddleware = require('./middlewares/jwtMiddleware'); // protects routes that need auth
const fs = require('fs');

const app = express();

// Middleware stack
app.use(cors());
app.use(express.json());   // Parse JSON bodies
app.use(morgan('dev'));    // Simple request logger

// Public routes (register, login, get products) – no JWT needed
app.use('/', allRoutes);  // allRoutes already includes both public & protected routes
// Note: jwtMiddleware is applied inside individual route definitions where required
// Serve the uploads folder (where product images are stored)
app.use('/uploads', (req, res, next) => {
    // Resolve the absolute file path on disk
    const filePath = path.join(__dirname, 'uploads', decodeURIComponent(req.path));
    // If the file exists, let express.static handle it
    if (fs.existsSync(filePath)) {
        return next();
    }
    // Otherwise, serve a placeholder image
    const placeholderPath = path.join(__dirname, 'public', 'placeholder.png');
    res.sendFile(placeholderPath);
});
// Now let Express serve the actual files (only reached when the file exists)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global error handler (fallback)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});