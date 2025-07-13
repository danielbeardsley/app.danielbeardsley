const express = require('express');
const api = express.Router();
const path = require('path');

const bmsAPIDest = 'http://127.0.0.1:1235'

const currentBMSInfo = {
   data: {},
   lastFetch: 0,
};

const RESPONSE_STALE_TIME_MS = 1000;

api.use((req, res, next) => {
   const origin = req.get('origin');
   if (origin && origin.match(/^https?:\/\/localhost($|:)/)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
   }
   next();
});

api.get('/current', async (req, res, next) => {
   if (Date.now() - currentBMSInfo.lastFetch > RESPONSE_STALE_TIME_MS) {
      const reponse = fetch(bmsAPIDest + "/current", {
         signal: AbortSignal.timeout(5000)
      });
      currentBMSInfo.lastFetch = Date.now();
      try {
         currentBMSInfo.data = await (await reponse).json();
      } catch (err) {
         console.error("Error fetching BMS data:", err);
         return res.status(503).json({ error: "Failed to fetch BMS data" });
      }
   }
   res.status(200).json(currentBMSInfo.data);
});

api.use(express.static(path.join(__dirname, 'bms/'), {
   index: ['index.html'], // serve index.html
   redirect: true, // redirect to add slash if target is directory
}));

module.exports = api;
