const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Scan = require('../models/Scan');
const { generateToken } = require('../utils/auth');

describe('API Tests', () => {
    let adminToken;
    let doctorToken;
    let testPatient;
    let testScan;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGO_TEST_URI);
        
        // Create test users
        const admin = await User.create({
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            name: 'Admin User'
        });

        const doctor = await User.create({
            email: 'doctor@test.com',
            password: 'password123',
            role: 'doctor',
            name: 'Doctor User'
        });

        // Generate tokens
        adminToken = generateToken(admin);
        doctorToken = generateToken(doctor);

        // Create test patient
        testPatient = await Patient.create({
            patientId: 'TEST001',
            name: 'Test Patient',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            contact: {
                email: 'patient@test.com',
                phone: '1234567890'
            }
        });

        // Create test scan
        testScan = await Scan.create({
            patientId: testPatient._id,
            doctorId: doctor._id,
            scanDate: new Date(),
            status: 'pending',
            imageUrl: '/uploads/test.jpg'
        });
    });

    afterAll(async () => {
        // Clean up test data
        await User.deleteMany({});
        await Patient.deleteMany({});
        await Scan.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Authentication', () => {
        test('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'doctor@test.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        test('should not login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'doctor@test.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('Patient Management', () => {
        test('should create new patient', async () => {
            const res = await request(app)
                .post('/api/patients')
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    patientId: 'TEST002',
                    name: 'New Patient',
                    dateOfBirth: '1995-01-01',
                    gender: 'female'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id');
        });

        test('should get patient by ID', async () => {
            const res = await request(app)
                .get(`/api/patients/${testPatient._id}`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.patientId).toBe('TEST001');
        });

        test('should update patient information', async () => {
            const res = await request(app)
                .patch(`/api/patients/${testPatient._id}`)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    contact: {
                        phone: '9876543210'
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.contact.phone).toBe('9876543210');
        });
    });

    describe('Scan Management', () => {
        test('should upload new scan', async () => {
            const res = await request(app)
                .post('/api/scans')
                .set('Authorization', `Bearer ${doctorToken}`)
                .field('patientId', testPatient._id)
                .attach('scan', 'tests/fixtures/test-scan.jpg');

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('imageUrl');
        });

        test('should get scan by ID', async () => {
            const res = await request(app)
                .get(`/api/scans/${testScan._id}`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.patientId).toBe(testPatient._id.toString());
        });

        test('should update scan status', async () => {
            const res = await request(app)
                .patch(`/api/scans/${testScan._id}`)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    status: 'processing'
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('processing');
        });
    });

    describe('Report Generation', () => {
        test('should generate report for scan', async () => {
            const res = await request(app)
                .post(`/api/scans/${testScan._id}/report`)
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('reportUrl');
        });
    });

    describe('Security', () => {
        test('should not access admin routes with doctor token', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.status).toBe(403);
        });

        test('should access admin routes with admin token', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });
    });
}); 