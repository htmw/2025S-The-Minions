const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    contact: {
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: String,
        address: String
    },
    medicalHistory: [{
        condition: String,
        diagnosis: String,
        treatment: String,
        date: Date
    }],
    assignedDoctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    scans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scan'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    notes: [{
        content: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastVisit: Date,
    nextAppointment: Date
}, {
    timestamps: true
});

// Indexes for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ assignedDoctors: 1 });
patientSchema.index({ status: 1 });

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
    return Math.floor((new Date() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Method to add a new medical history entry
patientSchema.methods.addMedicalHistory = async function(entry) {
    this.medicalHistory.push({
        ...entry,
        date: new Date()
    });
    return this.save();
};

// Method to add a new note
patientSchema.methods.addNote = async function(content, doctorId) {
    this.notes.push({
        content,
        createdBy: doctorId
    });
    return this.save();
};

// Method to assign a doctor
patientSchema.methods.assignDoctor = async function(doctorId) {
    if (!this.assignedDoctors.includes(doctorId)) {
        this.assignedDoctors.push(doctorId);
        return this.save();
    }
    return this;
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient; 