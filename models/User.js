const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
    otp: {
        type: String,
        default: '',
    },
    otpExpiry: {
        type: Date,
    },
  
});

module.exports = mongoose.model('User', userSchema);
