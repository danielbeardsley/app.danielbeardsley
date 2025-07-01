const express = require('express');
const basicAuth = require('express-basic-auth');
const app = express.Router();
const path = require('path');

app.use(basicAuth({
   users: { bush: process.env.BUSH_ROAD_PASSWORD },
   challenge: true // enables basic auth challenge
}));
app.use(express.static(path.join(__dirname, 'bush-road/public'), {
   index: ['index.html'], // serve index.html
   redirect: true, // redirect to add slash if target is directory
}));

module.exports = app;
