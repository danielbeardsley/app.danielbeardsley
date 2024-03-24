const express = require('express');
const createError = require('http-errors');
const api = express.Router();
const fsPromises = require('fs/promises');
const path = require('path');
const csvParse = require('csv-parse/sync');

api.param('collectionName', safeParamValidator)
api.param('seriesName', safeParamValidator)
// POST Create a new directory
api.post('/collection', async (req, res, next) => {
    console.log("new collection");
    const [collectionName, dirName] = newCollection();
    await fsPromises.mkdir(dirName);
    res.json({name: collectionName, series: []});
  });

api.route('/collection/:collectionName')
  .get(loadCollectionMiddleware, (req, res, next) => {
    const { collection } = req._data;
    res.json({
      name: collection.name,
      seriesNames: collection.seriesNames,
    });
  });

api.route('/collection/:collectionName/:seriesName')
  // GET: view a series
  .get(loadSeriesMiddleware, respondWithSeries)
  // POST Create a new time-series
  .post(async (req, res, next) => {
    const collectionName = req.params.collectionName;
    const seriesName = req.params.seriesName;
    const filename = nameToPath(collectionName, seriesName);
    const exists = await loadSeries(req.params.collectionName, req.params.seriesName)
    .then(() => true, () => false);
    if (exists) {
      return error(res, 409, `series (${seriesName}) already exists`);
    }
    await writeRecord(filename, ["timestamp", "value"]);
    next();
  }, loadSeriesMiddleware, respondWithSeries);
  
// POST: append to the file
api.post('/collection/:collectionName/:seriesName/record', 
  async (req, res, next) => {
    const valueStr = req.body?.value;
    const value = parseFloat(valueStr, 10);
    const filename = nameToPath(req.params.collectionName, req.params.seriesName);
    await writeRecord(filename, [ts(), value]);
    next();
  }, loadSeriesMiddleware, respondWithSeries)

function newCollection() {
  const name = require('crypto').randomUUID()
  return [name, `user-data/time-series/${name}`];
}

function nameToPath(collectionName, seriesName) {
  if (seriesName) {
    return `user-data/time-series/${collectionName}/${seriesName}.csv`;
  } else {
    return `user-data/time-series/${collectionName}`;
  }
}

function writeRecord(filename, values) {
   return fsPromises.appendFile(filename, values.join(", ") + "\n");
}

function safeParamValidator(req, res, next, paramValue) {
  if (/^[0-9a-zA-Z-]+$/.test(paramValue)) {
    next();
  } else {
    error(res, 404, paramValue + " is invalid; names must be composed of numbers, letters and dashes only");
  }
}

function makeSafeName(name) {
  return name.replace(/[^0-9a-zA-Z-]+/g,'-');
}

async function tailSeries(filename, res) {
   const data = await fsPromises.readFile(filename);
   res.type("text/plain");
   res.send(data);
   res.end();
}

function seriesUrl(collectionName, seriesName) {
  return `${app.mountpath}/collection/${collectionName}/${seriesName}`;
}

function collectionUrl(collectionName) {
  return `${app.mountpath}/collection/${collectionName}`;
}

function ts() {
   return Math.round(Date.now()/1000);
}

function loadCollectionMiddleware(req, res, next) {
  const collectionName = req.params.collectionName;
  const dirname = nameToPath(collectionName);
  fsPromises.readdir(dirname)
    .then((names) => {
      req._data = {
        collection: {
          name: collectionName,
          seriesNames: names.map((name) => path.basename(name, '.csv')),
        }
      };
      next();
    }).catch(() => error(res, 404, "collection not found"));
}

function loadSeriesMiddleware(req, res, next) {
  loadSeries(req.params.collectionName, req.params.seriesName)
    .then((series) => {
      req._data = { series };
      next();
    }).catch((err) => console.log(err) && error(res, 404, `series (${req.params.seriesName}) not found`));
}

function respondWithSeries(req, res, next) {
  const { series } = req._data;
  res.json({
    name: series.name,
    measurements: series.measurements,
  });
}

function loadSeries(collectionName, seriesName) {
  const filename = nameToPath(collectionName, seriesName);
  console.log("loading series from", filename);
  return fsPromises.readFile(filename)
    .then((seriesCsv) => ({
      name: seriesName,
      measurements: csvParse.parse(seriesCsv, {
        columns: true,
        ltrim: true
      }) || [],
    }));
}

function error(res, code, message) {
  res.status(code).json({error: message});
}

module.exports = api;