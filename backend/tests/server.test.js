const express = require('express');
const request = require('supertest');

describe('Server API Test', () =>{
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        app.post('/api/mri-scans/upload', (req, res) => {
            if (!req.body || Object.keys(req.body).length === 0){
                return res.status(400).json({message: 'Data Required!'});
            }
            res.json({message: 'Data received!', data: req.body});
        
        });
    });

    test('POST /api/mri-scans/upload should respond with a json object and received data', async() => {
        const data = {name: 'Patient0001', age: 25};
        const response = await request(app)
            .post('/api/mri-scans/upload')
            .send(data)
            .expect(200);
        expect(response.body).toEqual({
            message: 'Data received!',
            data
        });
    });

    test('POST /api/mri-scans/upload should return an error if no data sent', async() =>{
        const response = await request(app)
            .post('/api/mri-scans/upload')
            .send()
            .expect(400);
        expect(response.body).toEqual({
            message: 'Data Required!'
        });

    });

});

