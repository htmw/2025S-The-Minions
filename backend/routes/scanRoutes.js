const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const { auth, checkRole } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const mlService = require('../services/mlService');
const reportService = require('../services/reportService');
const { logger, errorLog } = require('../utils/logger');

// Get all scans with pagination and filtering
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.patientId) query.patientId = req.query.patientId;
        if (req.query.startDate && req.query.endDate) {
            query.scanDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const scans = await Scan.find(query)
            .sort({ scanDate: -1 })
            .skip(skip)
            .limit(limit)
            .populate('doctorId', 'name email');

        const total = await Scan.countDocuments(query);

        res.json({
            scans,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalScans: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get scan by id
router.get('/:id', auth, async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id)
            .populate('doctorId', 'name email');

        if (!scan) return res.status(404).json({ message: 'Scan not Found!' });
        res.json(scan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload and create new scan
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        logger.info('Starting scan upload process');
        logger.info(`Request body: ${JSON.stringify(req.body)}`);

        if (!req.file) {
            logger.info('No image file provided in upload request');
            return res.status(400).json({ message: 'Image file is required!' });
        }

        // Create proper URL for the image
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        logger.info(`Generated image URL: ${imageUrl}`);

        // Check if patientName is missing
        if (!req.body.patientName) {
            logger.error('Patient name is missing from request');
            return res.status(400).json({ message: 'Patient name is required!' });
        }

        const scan = new Scan({
            patientId: req.body.patientId,
            patientName: req.body.patientName,
            scanDate: req.body.scanDate || Date.now(),
            imageUrl: imageUrl,
            originalPath: req.file.path,
            doctorId: req.user._id,
            status: 'pending'
        });

        const savedScan = await scan.save();
        logger.info(`Scan saved to database with ID: ${savedScan._id}`);

        // Trigger ML analysis
        try {
            logger.info(`Triggering ML analysis for scan ${savedScan._id}`);
            const analysisJob = await mlService.analyzeScan(savedScan._id);
            savedScan.analysisJobId = analysisJob.jobId;
            savedScan.status = 'processing';
            await savedScan.save();
            logger.info(`ML analysis job created with ID: ${analysisJob.jobId}`);
        } catch (error) {
            errorLog(error);
            savedScan.status = 'upload_complete';
            await savedScan.save();
        }

        res.status(201).json(savedScan);
    } catch (error) {
        errorLog(error);
        res.status(400).json({ error: error.message });
    }
});

// Get scan analysis status
router.get('/:id/status', auth, async (req, res) => {
    try {
        const scanId = req.params.id;
        logger.info(`Checking analysis status for scan ${scanId}`);

        const scan = await Scan.findById(scanId);
        if (!scan) {
            logger.error(`Scan not found: ${scanId}`);
            return res.status(404).json({ message: 'Scan not found' });
        }

        if (!scan.analysisJobId) {
            logger.info(`No analysis job ID found for scan ${scanId}, status: ${scan.status}`);
            return res.json({ status: scan.status });
        }

        // Get status from ML service
        logger.info(`Getting analysis status for job ${scan.analysisJobId}`);
        const analysisStatus = await mlService.getAnalysisStatus(scan.analysisJobId);
        logger.info(`Analysis status for job ${scan.analysisJobId}:`, analysisStatus);

        // Update scan status if needed
        if (analysisStatus.state === 'completed' && scan.status !== 'completed') {
            logger.info(`Analysis completed for scan ${scanId}, updating status`);
            scan.status = 'completed';
            scan.result = analysisStatus.result;
            await scan.save();
        } else if (analysisStatus.state === 'failed' && scan.status !== 'failed') {
            logger.error(`Analysis failed for scan ${scanId}`);
            scan.status = 'failed';
            scan.processingHistory.push({
                status: 'failed',
                message: analysisStatus.failedReason || 'Analysis failed'
            });
            await scan.save();
        }

        res.json({
            status: scan.status,
            jobStatus: analysisStatus
        });
    } catch (error) {
        logger.error(`Error getting analysis status for scan ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Update scan status and results
router.patch('/:id', auth, checkRole(['admin', 'doctor']), async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ message: 'Scan not Found!' });

        // Update scan fields
        Object.keys(req.body).forEach(key => {
            if (key === 'result') {
                scan.result = { ...scan.result, ...req.body.result };
            } else {
                scan[key] = req.body[key];
            }
        });

        // Add to processing history
        scan.processingHistory.push({
            status: scan.status,
            message: req.body.message || 'Status updated'
        });

        const updatedScan = await scan.save();
        res.json(updatedScan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add annotation to scan
router.post('/:id/annotations', auth, checkRole(['admin', 'doctor']), async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ message: 'Scan not Found!' });

        scan.annotations.push({
            x: req.body.x,
            y: req.body.y,
            text: req.body.text
        });

        const updatedScan = await scan.save();
        res.json(updatedScan);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete scan (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const scan = await Scan.findByIdAndDelete(req.params.id);
        if (!scan) return res.status(404).json({ message: 'Scan not Found!' });
        res.json({ message: 'Scan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate report for scan
router.post('/:id/report', auth, async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ message: 'Scan not Found!' });

        // Generate report
        const reportPath = await reportService.generateReport(req.params.id, scan.patientId);

        // Return report URL
        res.json({
            message: 'Report generated successfully',
            reportUrl: `/reports/report-${req.params.id}.pdf`
        });
    } catch (error) {
        logger.error(`Error generating report for scan ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
