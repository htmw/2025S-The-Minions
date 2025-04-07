const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { auth, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validatePatient = [
    body('patientId').trim().notEmpty().withMessage('Patient ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    body('contact.email').optional().isEmail().withMessage('Valid email is required'),
    body('contact.phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Valid phone number is required')
];

// Get all patients with pagination and filtering
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { patientId: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // If not admin, only show patients assigned to the doctor
        if (req.user.role !== 'admin') {
            query.assignedDoctors = req.user._id;
        }

        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('assignedDoctors', 'name email')
            .populate('scans', 'scanDate status');

        const total = await Patient.countDocuments(query);

        res.json({
            patients,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPatients: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get patient by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('assignedDoctors', 'name email')
            .populate('scans', 'scanDate status result')
            .populate('notes.createdBy', 'name');

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Check if user has access to this patient
        if (req.user.role !== 'admin' && !patient.assignedDoctors.some(doc => doc._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new patient
router.post('/', auth, validatePatient, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const patient = new Patient({
            ...req.body,
            assignedDoctors: [req.user._id]
        });

        const savedPatient = await patient.save();
        res.status(201).json(savedPatient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update patient
router.patch('/:id', auth, validatePatient, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Check if user has access to this patient
        if (req.user.role !== 'admin' && !patient.assignedDoctors.some(doc => doc._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        Object.keys(req.body).forEach(key => {
            if (key === 'contact') {
                patient.contact = { ...patient.contact, ...req.body.contact };
            } else {
                patient[key] = req.body[key];
            }
        });

        const updatedPatient = await patient.save();
        res.json(updatedPatient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add medical history entry
router.post('/:id/medical-history', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await patient.addMedicalHistory(req.body);
        res.json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add note to patient
router.post('/:id/notes', auth, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await patient.addNote(req.body.content, req.user._id);
        res.json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Assign doctor to patient
router.post('/:id/assign-doctor', auth, checkRole(['admin']), async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await patient.assignDoctor(req.body.doctorId);
        res.json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete patient (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 