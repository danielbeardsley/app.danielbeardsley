const express = require('express');
const createError = require('http-errors');
const router = express.Router();
const fsPromises = require('fs/promises');
const path = require('path');

router.use("/collection", express.static("user-data/time-series",{
   index: false, // don't serve index.html
   redirect: false, // don't redirect to add slash if target is directory
}));
router.param('collectionName', safeParamValidator)
router.param('seriesName', safeParamValidator)
router.route('/')
   // GET: Show the form to create a new file
  .get((req, res, next) => {
    res.render('collection-create');
  })
  // POST Create a new directory
  .post(async (req, res, next) => {
    const [collectionName, dirName] = newCollection();
    await fsPromises.mkdir(dirName);
    redirectToCollectionView(collectionName, res);
  });

router.route('/collection/:collectionName')
  // GET: Show collection page
  .get((req, res, next) => {
    const dirname = nameToPath(req.params.collectionName);
    fsPromises.readdir(dirname)
      .then((names) =>
        res.render("collection", {
          url: req.originalUrl,
          seriesNames: names.map((name) => path.basename(name, '.csv')),
        })
      ).catch(() => next(createError(404)));
  })
  // POST Create a new time-series
  .post(async (req, res, next) => {
    const collectionName = req.params.collectionName;
    console.log(req.body);
    console.log(req.params);
    const seriesName = makeSafeName(req.body.newSeriesName);
    const filename = nameToPath(collectionName, seriesName);
    await writeRecord(filename, ["timestamp", "value"]);
    redirectToSeriesView(collectionName, seriesName, res);
  });

router.route('/collection/:collectionName/:seriesName')
  // GET: view a series
  .get((req, res, next) => {
    const filename = nameToPath(req.params.collectionName, req.params.seriesName);
     fsPromises.readFile(filename)
     .then((data) =>
        res.render("series", {
          url: req.originalUrl,
          name: req.params.seriesName,
          data,
        })
     ).catch(() => next(createError(404)));
  })
  // POST: append to the file
  .post(async (req, res, next) => {
    const valueStr = req.body?.value;
    const value = parseInt(valueStr, 10);
    const filename = nameToPath(req.params.collectionName, req.params.seriesName);
    await writeRecord(filename, [ts(), value]);
    redirectToSeriesView(req.params.collectionName, req.params.collectionName, res);
  });

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

function redirectToSeriesView(collectionName, seriesName, res) {
  res.redirect(`/timeseries/collection/${collectionName}/${seriesName}`);
}

function redirectToCollectionView(collectionName, res) {
  res.redirect(`/timeseries/collection/${collectionName}`);
}

function ts() {
   return Math.round(Date.now()/1000);
}

module.exports = router;
