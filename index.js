require('dotenv').config()
require('./config/db')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const routes = require('./routes/allRoutes')

const server = express()

// 1. Security Headers via Helmet
server.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
    })
)

// 2. CORS configuration
server.use(
    cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// 3. Body parsers with size limit
server.use(express.json({ limit: '10mb' }))
server.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 4. Rate Limiting protection
// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes.",
    },
})

// Strict Auth limiter for brute-force protection
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
})

server.use("/login", authLimiter)
server.use("/register", authLimiter)
server.use(apiLimiter)

// 5. Routes and Static uploads
server.use(routes)
server.use('/uploads', express.static('./uploads'))

const PORT = parseInt(process.env.PORT, 10) || 5000

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}... Waiting for client request!!!`);  
})

server.get('/', (req, res) => {
    res.status(200).send(`<h1>Hawkeye Vision API Server Running</h1>`)
})

// 6. Global sanitized error handler
server.use((err, req, res, next) => {
    console.error("Server uncaught error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    })
})
