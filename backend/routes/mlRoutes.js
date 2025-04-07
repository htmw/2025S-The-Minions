const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const { auth, checkRole } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Analyze brain scan
router.post('/brain/analyze', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const { scanId } = req.body;
        const result = await mlService.analyzeBrainScan(scanId);
        res.json(result);
    } catch (error) {
        logger.error('Error in brain scan analysis route', { error: error.message });
        res.status(500).json({ error: 'Failed to analyze brain scan' });
    }
});

// Analyze chest scan
router.post('/chest/analyze', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const { scanId } = req.body;
        const result = await mlService.analyzeChestScan(scanId);
        res.json(result);
    } catch (error) {
        logger.error('Error in chest scan analysis route', { error: error.message });
        res.status(500).json({ error: 'Failed to analyze chest scan' });
    }
});

// Get analysis status
router.get('/status/:scanId', auth, async (req, res) => {
    try {
        const { scanId } = req.params;
        const status = await mlService.getAnalysisStatus(scanId);
        res.json(status);
    } catch (error) {
        logger.error('Error getting analysis status', { error: error.message });
        res.status(500).json({ error: 'Failed to get analysis status' });
    }
});

module.exports = router; 