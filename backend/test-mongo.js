require('dotenv').config();
const mongoose = require('mongoose');

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    mongoose.disconnect();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
