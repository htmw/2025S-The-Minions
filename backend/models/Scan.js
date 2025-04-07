const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: true
        },
        patientName: {
            type: String,
            required: true
        },
        scanDate: {
            type: Date,
            default: Date.now
        },
        imageUrl: {
            type: String,
            required: true
        },
        result: {
            hasTumor: {type: Boolean, default: false},
            confidence: {type: Number, min: 0, max: 1},
            tumorType: {type: String, default: ''},
            tumorLocation: {type: String, default: ''},
            tumorSize: {type: String, default: ''},
            additionalNotes: {type: String, default: ''}
        },
        status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'processing', 'completed', 'failed']
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reportUrl: {
            type: String,
            default: ''
        },
        annotations: [{
            x: Number,
            y: Number,
            text: String,
            createdAt: { type: Date, default: Date.now }
        }],
        processingHistory: [{
            status: String,
            timestamp: { type: Date, default: Date.now },
            message: String
        }]
    }, 
    {timestamps: true}
);

// Add indexes for better query performance
scanSchema.index({ patientId: 1 });
scanSchema.index({ scanDate: -1 });
scanSchema.index({ status: 1 });

// link Scan to the collection named scans (whaich is automatically generated when run Scan.js, 
// so this Scan represent the collection whcih we can operate later)

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;
