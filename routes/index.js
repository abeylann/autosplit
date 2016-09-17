'use strict';

const express = require('express');
const router = express.Router();
module.exports = router;

router.use('/token', require('./token.js'));

