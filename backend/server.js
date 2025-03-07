//Listening to request(import express, create instance )
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const scanRoutes = require('./routes/scanRoutes');

//using API endpoints,creating routes test backend connection
const cors = require('cors');
//loads middleware first!
app.use(express.json());
app.use(cors());
app.use('/api/scans', scanRoutes);
app.get('/api/test', (req, res) => {
    res.json({status: 'Backend is running!'});
});


//test data receving(only for json right now, need to use multer to upload MRI scan later)

 app.post('/api/test/upload', (req, res) => {
   
    if (!req.body || Object.keys(req.body).length === 0){
            return res.status(400).json({message: 'Data Required!'});
    }
    const receivedData = req.body;
     console.log('Received data:', receivedData);
     res.json({message: 'Data received!', data: receivedData});
});
    
     


 //Add MongoDB connection
 mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDb connected'))
    .catch(err => console.log('MongoDB connection error:', err));

//start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`status: Backend server is running on ${PORT}`);
});