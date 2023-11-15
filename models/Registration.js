// models/Registration.js
const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  gender: String,
});

const RegistrationSchema = new mongoose.Schema({
  teamName: String,
  teamMembers: Number,
  teamLeaderName: String,
  college: String,
  branch: String,
  rollNumber: String,
  email: String,
  mobileNumber: String,
  teamMemberDetails: [TeamMemberSchema],
  track: String,
});

const Registration = mongoose.model('Registration', RegistrationSchema);

module.exports = Registration;
