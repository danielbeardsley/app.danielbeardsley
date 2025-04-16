const express = require('express');
const api = express.Router();

const SECRET = process.env.BMS_UPDATE_SECRET;

let currentBMSValues = {};

// POST: set the current values
api.post('/current', validationMiddleware, async (req, res, next) => {
  const json = req.body;
  currentBMSValues = json;
  res.end();
});

// GET: Get the current values
api.get('/current', async (req, res, next) => {
  res.json(currentBMSValues);
});

function validationMiddleware(req, res, next) {
  if (req.get('authorization') !== SECRET) {
    res.sendStatus(401);
  }
  next();
}

module.exports = api;
