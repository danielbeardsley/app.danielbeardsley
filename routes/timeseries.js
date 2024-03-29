const express = require('express');
const createError = require('http-errors');
const app = express();
const fsPromises = require('fs/promises');
const path = require('path');
const csvParse = require('csv-parse/sync');
const apiRoute = require('./timeseries_api');

app.use("/collection", express.static("user-data/time-series",{
   index: false, // don't serve index.html
   redirect: false, // don't redirect to add slash if target is directory
}));
app.param('collectionName', safeParamValidator)
app.param('seriesName', safeParamValidator)
app.route('/')
   // GET: Show the form to create a new file
  .get((req, res, next) => {
    res.render('collection-create');
  })
  // POST Create a new directory
  .post(async (req, res, next) => {
    const [collectionName, dirName] = newCollection();
    await fsPromises.mkdir(dirName);
    res.redirect(collectionUrl(collectionName));
  });

app.route('/collection/:collectionName')
  .get(loadCollection, (req, res, next) => {
    const { collection } = req._data;
    res.render("collection", {
      collectionUrl: collectionUrl(collection.name),
      seriesNames: collection.seriesNames,
    });
  })
  // POST Create a new time-series
  .post(async (req, res, next) => {
    const collectionName = req.params.collectionName;
    const seriesName = makeSafeName(req.body.newSeriesName);
    const filename = nameToPath(collectionName, seriesName);
    await writeRecord(filename, ["timestamp", "value"]);
    res.redirect(seriesUrl(collectionName, seriesName));
  });

app.route('/collection/:collectionName/:seriesName')
  // GET: view a series
  .get(loadSeries, (req, res, next) => {
    const { series } = req._data;
    res.render("series", {
      url: req.originalUrl,
      name: series.name,
      measurements: series.measurements,
    });
  })
  // POST: append to the file
  .post(async (req, res, next) => {
    const valueStr = req.body?.value;
    const value = parseFloat(valueStr, 10);
    const filename = nameToPath(req.params.collectionName, req.params.seriesName);
    await writeRecord(filename, [ts(), value]);
    res.redirect(seriesUrl(req.params.collectionName, req.params.seriesName));
  });

app.use("/api", apiRoute);

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
    next(createError(404));
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

function loadCollection(req, res, next) {
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
    }).catch(() => next(createError(404)));
}

function loadSeries(req, res, next) {
  const filename = nameToPath(req.params.collectionName, req.params.seriesName);
  fsPromises.readFile(filename)
    .then((data) => {
      req._data = {
        series: {
          name: req.params.seriesName,
          measurements: csvParse.parse(data, {
            columns: true,
            ltrim: true
          }) || [],
        }
      };
      next();
    }).catch(() => next(createError(404)));
}

module.exports = app;
