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
  
  team_member_1: String,
  team_member_1_roll_no: String,
  team_member_1_gender: String,
  
  team_member_2: String,
  team_member_2_roll_no: String,
  team_member_2_gender: String,
  
  team_member_3: String,
  team_member_3_roll_no: String,
  team_member_3_gender: String,
  
  team_member_4: String,
  team_member_4_roll_no: String,
  team_member_4_gender: String,

  team_member_5: String,
  team_member_5_roll_no: String,
  team_member_5_gender: String,
  
  track: String,

  file_path: String,
});

const Registration = mongoose.model('Registration', RegistrationSchema);

module.exports = Registration;
