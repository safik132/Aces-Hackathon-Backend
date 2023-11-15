const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require("./routes/routes")
const db_secret_connect = process.env.MONGOURI;

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  // Set the response Content-Type to text/html
  res.setHeader('Content-Type', 'text/html');

  // Send an HTML response with an <h1> element
  res.status(200).send('<h1>Alpha Server Started</h1> ');
});

app.use("/api", router); // localhost:5000/bookd

// MongoDB Connection
const dbUri = db_secret_connect;
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// // POST API Endpoint
// app.post('/api/register', async (req, res) => {
//   try {
//     const newRegistration = new Registration(req.body);
//     const savedRegistration = await newRegistration.save();
//     res.status(201).json(savedRegistration);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
