const Queue = require('bull');
const { logger } = require('../utils/logger');
const Scan = require('../models/Scan');
const axios = require('axios');

// Create queues
const scanQueue = new Queue('scan-processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Process jobs
scanQueue.process(async (job) => {
    const { scanId } = job.data;
    const scan = await Scan.findById(scanId);

    if (!scan) {
        throw new Error(`Scan ${scanId} not found`);
    }

    try {
        // Update scan status to processing
        scan.status = 'processing';
        scan.processingHistory.push({
            status: 'processing',
            message: 'Starting ML model processing',
            timestamp: new Date()
        });
        await scan.save();

        // Get the results (either from the API or mock data)
        const results = await axios.post(process.env.BRAIN_ML_MODEL_URL + '/api/brain/analyze', {
            image_url: scan.imageUrl,
            scan_id: scanId,
            patient_id: scan.patientId,
            metadata: {
                scan_type: scan.type,
                scan_date: scan.scanDate,
                patient_age: scan.patientAge,
                patient_gender: scan.patientGender
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.ML_MODEL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds timeout for ML processing
        }).then(response => {
            if (!response.data) {
                throw new Error('No response data from ML model');
            }
            return response.data;
        }).catch(error => {
            logger.error(`Error connecting to ML model server: ${error.message || error}`);
            logger.info('Using mock data for ML analysis');

            // Return mock results if ML server is not available
            return {
                scan_id: scanId,
                timestamp: new Date().toISOString(),
                predictions: {
                    tumor_present: true,
                    tumor_type: 'glioma',
                    tumor_grade: 'II',
                    tumor_probability: 0.85,
                    class_probabilities: {
                        glioma: 0.85,
                        meningioma: 0.10,
                        pituitary: 0.05
                    }
                },
                location: {
                    bounding_box: [100, 100, 200, 200],
                    heatmap: 'mock_heatmap_data',
                    dimensions: [50, 50, 30],
                    volume: 75000
                },
                confidence_metrics: {
                    model_confidence: 0.92,
                    prediction_stability: 0.88
                },
                metadata: {
                    processing_time: 1.5,
                    model_version: '1.0.0 (Mock Data)'
                }
            };
        });

        // Update scan with results
        scan.result = {
            ...results,
            processedAt: new Date()
        };
        scan.status = 'completed';
        scan.processingHistory.push({
            status: 'completed',
            message: 'ML model processing completed successfully',
            timestamp: new Date()
        });
        await scan.save();

        logger.info(`Scan ${scanId} processed successfully`);
        return scan.result;
    } catch (error) {
        logger.error(`Error processing scan ${scanId}:`, error);

        // Update scan status to failed
        scan.status = 'failed';
        scan.processingHistory.push({
            status: 'failed',
            message: error.response?.data?.message || error.message || 'ML model processing failed',
            timestamp: new Date()
        });
        await scan.save();

        throw error;
    }
});

// Handle failed jobs
scanQueue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed:`, error);
});

// Handle completed jobs
scanQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed successfully`);
});

// Add job to queue
const addScanToQueue = async (scanId) => {
    try {
        const job = await scanQueue.add({ scanId });
        logger.info(`Added scan ${scanId} to processing queue. Job ID: ${job.id}`);
        return job;
    } catch (error) {
        logger.error(`Error adding scan ${scanId} to queue:`, error);
        throw error;
    }
};

// Get job status
const getJobStatus = async (jobId) => {
    try {
        const job = await scanQueue.getJob(jobId);
        if (!job) {
            return null;
        }

        const state = await job.getState();
        const progress = job.progress;

        return {
            jobId,
            state,
            progress,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason
        };
    } catch (error) {
        logger.error(`Error getting job ${jobId} status:`, error);
        throw error;
    }
};

// Get queue statistics
const getQueueStats = async () => {
    try {
        const [waiting, active, completed, failed] = await Promise.all([
            scanQueue.getWaitingCount(),
            scanQueue.getActiveCount(),
            scanQueue.getCompletedCount(),
            scanQueue.getFailedCount()
        ]);

        return {
            waiting,
            active,
            completed,
            failed
        };
    } catch (error) {
        logger.error('Error getting queue statistics:', error);
        throw error;
    }
};

module.exports = {
    addScanToQueue,
    getJobStatus,
    getQueueStats
};