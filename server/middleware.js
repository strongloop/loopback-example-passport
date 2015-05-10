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

  app.middleware('initial:before', loopback.favicon());
  app.middleware('initial:before', loopback.compress());
  app.middleware('initial:before', bodyParser.json());
  app.middleware('initial:before', bodyParser.urlencoded({
    extended: true
  }));
  app.middleware('initial:before', flash());
  app.middleware('initial:before', loopback.static(path.resolve(__dirname, '../client/public')));
  app.middleware('initial:before', loopback.token({
    model: app.models.accessToken
  }));
  app.middleware('initial:before', loopback.cookieParser(app.get('cookieSecret')));
  app.middleware('initial:before', loopback.session({
    secret: 'kitty',
    saveUninitialized: true,
    resave: true
  }));

  // Requests that get this far won't be handled
  // by any middleware. Convert them into a 404 error
  // that will be handled later down the chain
  app.middleware('final', function () {
    loopback.urlNotFound();
  })

  // The ultimate error handler
  app.middleware('final:after', function () {
    loopback.errorHandler();
  })

}
