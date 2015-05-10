var path = require('path');

/*
 * body-parser is a piece of express middleware that
 *   reads a form's input and stores it as a javascript
 *   object accessible through `req.body`
 *
 */
var bodyParser = require('body-parser');

/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash      = require('express-flash');

module.exports = function (loopback, app) {

  app.middleware('initial:before', function () {

    loopback.favicon();
    loopback.compress();
    bodyParser.json();
    bodyParser.urlencoded({
      extended: true
    });
    flash();
    loopback.static(path.resolve(__dirname, '/../client/public'));

    loopback.token({
      model: app.models.accessToken
    });

    loopback.cookieParser(app.get('cookieSecret'));
    loopback.session({
      secret: 'kitty',
      saveUninitialized: true,
      resave: true
    });

  })

  app.middleware('final', function () {
    loopback.urlNotFound();
  })

  app.middleware('final:after', function () {
    loopback.errorHandler();
  })

}



// {
//   "initial:before": {
//     "loopback#favicon": {},
//     "loopback#compress": {}
//   },
//   "initial": {
//   },
//   "session": {
//   },
//   "auth": {
//   },
//   "parse": {
//   },
//   "routes": {
//   },
//   "files": {
//   },
//   "final": {
//     "loopback#urlNotFound": {}
//   },
//   "final:after": {
//     "loopback#errorHandler": {}
//   }
// }
