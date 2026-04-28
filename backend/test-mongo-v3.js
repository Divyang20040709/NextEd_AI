console.log('Script started');
const mongoose = require('mongoose');
console.log('Mongoose required');
const uri = 'mongodb://127.0.0.1:27017/NextEd';

console.log('Attempting to connect to:', uri);
mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  });
