'use strict';

const bodyParser = require('body-parser')
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.use('/api', require('./routes'))

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
	console.log('listening on', PORT)
});
