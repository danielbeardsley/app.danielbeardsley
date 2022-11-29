const express = require('express');
const router = express.Router();
const fsPromises = require('fs/promises');

router.get('/', (req, res, next) => {
  res.render('create');
});

router.post('/', async (req, res, next) => {
  console.log(req.headers);
  const [seriesName, filename] = newName();
  await writeRecord(filename, ['timestamp', 'value']);
  res.redirect(`/timeseries/record/${seriesName}`);
});

router.route(/^\/record\/([a-z0-9-]+)/)
.get(async (req, res, next) => {
  const seriesName = req.params[0];
   console.log("Recording: " + seriesName);
  const filename = nameToPath(seriesName);
  await writeRecord(filename, [Math.round(Date.now()/1000), Math.random() * 20]);
  tailSeries(filename, res);
});

function newName() {
  const name = require('crypto').randomUUID()
  return [name, nameToPath(name)];
}

function nameToPath(seriesName) {
  return `user-data/${seriesName}.csv`;
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

module.exports = router;
