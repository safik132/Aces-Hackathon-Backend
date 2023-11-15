const express = require('express');
const router = express.Router();
const { register } = require('../controller/register')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post('/register',upload.single('file'), register) 


module.exports = router 