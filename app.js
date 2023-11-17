// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const Registration = require('./models/Registration');
require('dotenv').config();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
