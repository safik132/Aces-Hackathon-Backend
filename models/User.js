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
  phone: {
    type: String,
    required: false,
    unique: false,
    sparse: false,
  },
  otp: {
    type: String,
    default: '',
  },
  otpExpiry: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model('User', userSchema);
