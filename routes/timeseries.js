const express = require('express');
const createError = require('http-errors');
const router = express.Router();
const fsPromises = require('fs/promises');

router.route('/')
   // GET: Show the form to create a new file
  .get((req, res, next) => {
    res.render('create');
  })
  // POST Create a new file
  .post(async (req, res, next) => {
    const [seriesName, filename] = newName();
    await writeRecord(filename, ['timestamp', 'value']);
    redirectToView(seriesName, res);
  });

router.use("/record", express.static("user-data/time-series"));
router.route(/^\/record\/([a-z0-9-]+)/)
  // Parse the param
  .all((req, res, next) => {
     const seriesName = req.params[0];
     if (seriesName.match(/^[a-z0-9-]+$/)) {
        req.params.seriesName = seriesName
        next();
     } else {
        next(createError(404));
     }
  })
  // GET: Show the form
  .get((req, res, next) => {
    const filename = nameToPath(req.params.seriesName);
     fsPromises.readFile(filename)
     .then((data) =>
        res.render("form", {
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
    const seriesName = req.params.seriesName;
    const filename = nameToPath(seriesName);
    await writeRecord(filename, [ts(), value]);
    redirectToView(seriesName, res);
  });

function newName() {
  const name = require('crypto').randomUUID()
  return [name, nameToPath(name)];
}

function nameToPath(seriesName) {
  return `user-data/time-series/${seriesName}.csv`;
}

function writeRecord(filename, values) {
   return fsPromises.appendFile(filename, values.join(", ") + "\n");
}

async function tailSeries(filename, res) {
   const data = await fsPromises.readFile(filename);
   res.type("text/plain");
   res.send(data);
   res.end();
}

function redirectToView(seriesName, res) {
  res.redirect(`/timeseries/record/${seriesName}`);
}

function ts() {
   return Math.round(Date.now()/1000);
}

module.exports = router;
