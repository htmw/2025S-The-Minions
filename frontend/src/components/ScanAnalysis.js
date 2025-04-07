import React, { useState, useEffect } from 'react';
import { scans, mlModel } from '../services/api';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';

const ScanAnalysis = ({ scanId }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const startAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mlModel.analyzeScan(scanId);
            setStatus(response.status);
            pollStatus(response.jobId);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const pollStatus = async (jobId) => {
        const interval = setInterval(async () => {
            try {
                const statusResponse = await mlModel.getAnalysisStatus(jobId);
                setStatus(statusResponse.status);

                if (statusResponse.status === 'completed') {
                    clearInterval(interval);
                    const resultsResponse = await mlModel.getAnalysisResults(scanId);
                    setResults(resultsResponse);
                    setLoading(false);
                } else if (statusResponse.status === 'failed') {
                    clearInterval(interval);
                    setError('Analysis failed');
                    setLoading(false);
                }
            } catch (err) {
                clearInterval(interval);
                setError(err.message);
                setLoading(false);
            }
        }, 5000); // Poll every 5 seconds
    };

    return (
        <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Scan Analysis
            </Typography>
            
            {error && (
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
            )}

            {loading ? (
                <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography>
                        Analyzing scan... {status}
                    </Typography>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={startAnalysis}
                    disabled={loading}
                >
                    Start Analysis
                </Button>
            )}

            {results && (
                <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                        Analysis Results:
                    </Typography>
                    <Typography>
                        Tumor Present: {results.hasTumor ? 'Yes' : 'No'}
                    </Typography>
                    <Typography>
                        Confidence: {(results.confidence * 100).toFixed(2)}%
                    </Typography>
                    <Typography>
                        Tumor Type: {results.tumorType || 'N/A'}
                    </Typography>
                    <Typography>
                        Location: {results.tumorLocation || 'N/A'}
                    </Typography>
                    <Typography>
                        Size: {results.tumorSize || 'N/A'}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default ScanAnalysis; 