const axios = require('axios');
const { logger } = require('../utils/logger');
const Scan = require('../models/Scan');
const { addScanToQueue, getJobStatus } = require('./queueService');

class MLService {
    constructor() {
        this.modelUrl = process.env.BRAIN_ML_MODEL_URL;
        if (!this.modelUrl) {
            logger.error('BRAIN_ML_MODEL_URL is not set in environment variables');
        }
    }

    async analyzeScan(scanId) {
        try {
            const scan = await Scan.findById(scanId);
            if (!scan) {
                throw new Error('Scan not found');
            }

            // Add scan to processing queue
            const job = await addScanToQueue(scanId);
            
            // Update scan with job ID
            scan.analysisJobId = job.id;
            scan.status = 'processing';
            await scan.save();

            logger.info(`ML model analysis started for scan ${scanId}`);
            return {
                jobId: job.id,
                status: 'processing'
            };
        } catch (error) {
            logger.error(`Error analyzing scan ${scanId}:`, error);
            throw error;
        }
    }

    async getAnalysisStatus(jobId) {
        try {
            const status = await getJobStatus(jobId);
            if (!status) {
                return { status: 'failed', message: 'Job not found' };
            }
            return status;
        } catch (error) {
            logger.error(`Error getting analysis status for job ${jobId}:`, error);
            throw error;
        }
    }

    async getAnalysisResults(scanId) {
        try {
            const scan = await Scan.findById(scanId);
            if (!scan) {
                throw new Error('Scan not found');
            }

            if (!scan.result) {
                throw new Error('Analysis results not available');
            }

            return scan.result;
        } catch (error) {
            logger.error(`Error getting analysis results for scan ${scanId}:`, error);
            throw error;
        }
    }
}

module.exports = new MLService(); 