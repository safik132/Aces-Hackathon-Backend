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
  const { name, email, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send('User already exists');
    }

    const otp = generateOtp();
    const otpExpiry = new Date(new Date().getTime() + (30 * 60 * 1000)); // 30 minutes from now

    const newUser = new User({ name, email, phone, otp, otpExpiry });
    await newUser.save();
    
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
    const otpExpiry = new Date(new Date().getTime() + (30 * 60 * 1000)); // 30 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendOtp(email, otp);

    res.status(200).send('OTP sent');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify OTP for registration
app.post('/api/verify-register', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, otp, otpExpiry: { $gte: new Date() } });
    if (!user) {
      return res.status(400).send('Invalid or expired OTP');
    }

    user.otp = '';
    user.otpExpiry = null;
    await user.save();

    res.status(201).send('User registered successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify OTP for login
app.post('/api/verify-login', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, otp, otpExpiry: { $gte: new Date() } });
    if (!user) {
      return res.status(400).send('Invalid or expired OTP');
    }

    user.otp = '';
    user.otpExpiry = null;
    await user.save();

    // Here, generate and send a JWT or some form of session token
    // This is a placeholder for actual token generation
    // const token = jwt.sign({ email }, 'your_secret_key');
    // res.status(200).json({ message: 'Logged in successfully', token });

    res.status(200).send('Logged in successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
