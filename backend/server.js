//Listening to request(import express, create instance )
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const passport = require('./config/passport');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const { logger, loggingMiddleware, morganStream } = require('./utils/logger');
const morgan = require('morgan');

// Import routes
const scanRoutes = require('./routes/scanRoutes');
const userRoutes = require('./routes/userRoutes');
const patientRoutes = require('./routes/patientRoutes');
const authRoutes = require('./routes/authRoutes');
const mlRoutes = require('./routes/mlRoutes');

// Security middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression
app.use(compression());

// Logging middleware
app.use(loggingMiddleware);
app.use(morgan('combined', { stream: morganStream }));

// Passport middleware
app.use(passport.initialize());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/ml', mlRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

//test data receving(only for json right now, need to use multer to upload MRI scan later)
app.post('/api/test/upload', (req, res) => {

    if (!req.body || Object.keys(req.body).length === 0){
            return res.status(400).json({message: 'Data Required!'});
    }
    const receivedData = req.body;
     console.log('Received data:', receivedData);
     res.json({message: 'Data received!', data: receivedData});
});

//Add MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});