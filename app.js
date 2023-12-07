// app.js

const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Registration = require('./models/Registration');
const User = require('./models/User');
const OTP = require('./models/Otp');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
// Configure multer for local file handling
const upload = multer({ dest: 'uploads/' });
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// POST API Endpoint

// Function to generate email content
const generateRegistrationEmailContent = (registrationData) => {
  return `
    <h1>Thank you for registering for Aces Hackathon!</h1>
    <p>Here are the details you provided:</p>
    <ul>
      <li>Team Name: ${registrationData.teamName}</li>
      <li>Team Leader: ${registrationData.teamLeaderName}</li>
      <li>College: ${registrationData.college}</li>
      <li>Branch: ${registrationData.branch}</li>
      <li>Roll Number: ${registrationData.rollNumber}</li>
      <li>Email: ${registrationData.email}</li>
      <li>Mobile Number: ${registrationData.mobileNumber}</li>
      <li>Track: ${registrationData.track}</li>
      <li>Uploaded File: True</li>
    </ul>
  `;
};

// POST API Endpoint for registration
app.post('/api/register', upload.single('file'), async (req, res) => {
  try {
    let file_path = '';

    if (req.file) {
      const fileStream = fs.createReadStream(req.file.path);

      const uploadParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: req.file.originalname,
        Body: fileStream
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      file_path = uploadResult.Location;
      fs.unlinkSync(req.file.path); // Delete the file from local storage after upload
    }

    const registrationData = {
      ...req.body,
      file_path: file_path
    };

    const newRegistration = new Registration(registrationData);
    const savedRegistration = await newRegistration.save();

    // Send email after successful registration
    const mailOptions = {
      from: process.env.EMAIL,
      to: savedRegistration.email,
      subject: 'Registration Confirmation for Aces Hackathon',
      html: generateRegistrationEmailContent(savedRegistration)
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error('Error sending registration confirmation email:', error);
      } else {
        console.log('Registration confirmation email sent:', info.response);
      }
    });

    res.status(201).json(savedRegistration);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper function to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP
const sendOtp = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP',
    text: `Your OTP is ${otp}`
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// Register user and send OTP
app.post('/api/registeruser', async (req, res) => {
  const { email } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send('User already exists');
    }

    const otp = generateOtp();
    const expiry = new Date(new Date().getTime() + (30 * 60 * 1000)); // 30 minutes from now

    // Save or update OTP in OTP collection
    await OTP.findOneAndUpdate({ email }, { email, otp, expiry }, { upsert: true });

    sendOtp(email, otp);

    res.status(200).send('OTP sent');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login user and send OTP
app.post('/api/login', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const otp = generateOtp();
    const expiry = new Date(new Date().getTime() + (30 * 60 * 1000)); // 30 minutes from now

    // Save or update OTP in OTP collection
    await OTP.findOneAndUpdate({ email }, { email, otp, expiry }, { upsert: true });

    sendOtp(email, otp);

    res.status(200).send('OTP sent');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify OTP for registration
// Verify OTP for registration
app.post('/api/verify-register', async (req, res) => {
  const { email, otp, name, phone } = req.body; // Include name and phone for registration

  try {
    const otpEntry = await OTP.findOne({ email, otp, expiry: { $gte: new Date() } });
    if (!otpEntry) {
      return res.status(400).send('Invalid or expired OTP');
    }

    // Save user details to User collection
    const newUser = new User({ name, email, phone });
    await newUser.save();

    // Delete OTP entry
    await OTP.deleteOne({ _id: otpEntry._id });

    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify OTP for login
app.post('/api/verify-login', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email, otp, expiry: { $gte: new Date() } });
    if (!otpEntry) {
      return res.status(400).send('Invalid or expired OTP');
    }

    // Delete OTP entry
    await OTP.deleteOne({ _id: otpEntry._id });

    // Generate JWT token for the verified user
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
