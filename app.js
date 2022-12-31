const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const timeSeriesApp = require('./routes/timeseries');
const htmlBytesRouter = require('./routes/html-bytes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(function(req, res, next){
   res.set("X-Robots-Tag", "noindex");
   next();
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), {
   index: false, // don't serve index.html
   redirect: false, // don't redirect to add slash if target is directory
}));

app.use('/timeseries', timeSeriesApp);
app.use('/html-bytes', htmlBytesRouter);
app.use('/', function(req, res) {
   res.render('index');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
