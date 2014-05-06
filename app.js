var loopback = require('loopback');
var path = require('path');
var app = module.exports = loopback();

/*
 * 1. Configure LoopBack models and datasources
 *
 * Read more at http://apidocs.strongloop.com/loopback#appbootoptions
 */

app.boot(__dirname);

/*
 * 2. Configure request preprocessing
 *
 *  LoopBack support all express-compatible middleware.
 */

app.use(loopback.favicon());
app.use(loopback.logger(app.get('env') === 'development' ? 'dev' : 'default'));
app.use(loopback.cookieParser(app.get('cookieSecret')));
app.use(loopback.token({model: app.models.accessToken}));
app.use(loopback.bodyParser());
app.use(loopback.methodOverride());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(loopback.session({ secret: 'keyboard cat' }));

var config = {};
try {
  config = require('./providers.json');
} catch(err) {
  console.error('Please configure your passport strategy in providers.json as follows:');
  console.error('{ "facebook":');
  console.error('  { "clientID": "your-facebook-client-id",');
  console.error('    "clientSecret": "your-facebook-client-secret",');
  console.error('    "callbackURL": "http://localhost:3000/auth/facebook/callback" }');
  console.error('}');
  process.exit(1);
}

var socialLogin = require('./social-login');

for(var s in config) {
  var c = config[s];
  c.session = c.session !== false;
  socialLogin(s, c);
}

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

app.get('/auth/account', ensureLoggedIn('/login.html'), function(req, res, next) {
  res.render('loginProfiles', {user: req.user});
});

app.get('/link/account', ensureLoggedIn('/link.html'), function(req, res, next) {
  res.render('linkedAccounts', {user: req.user});
});

app.get('/auth/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

/*
 * EXTENSION POINT
 * Add your custom request-preprocessing middleware here.
 * Example:
 *   app.use(loopback.limit('5.5mb'))
 */

/*
 * 3. Setup request handlers.
 */

// LoopBack REST interface
app.use(app.get('restApiRoot'), loopback.rest());

// API explorer (if present)
try {
  var explorer = require('loopback-explorer')(app);
  app.use('/explorer', explorer);
  app.once('started', function(baseUrl) {
    console.log('Browse your REST API at %s%s', baseUrl, explorer.route);
  });
} catch(e){
  console.log(
    'Run `npm install loopback-explorer` to enable the LoopBack explorer'
  );
}

/*
 * EXTENSION POINT
 * Add your custom request-handling middleware here.
 * Example:
 *   app.use(function(req, resp, next) {
 *     if (req.url == '/status') {
 *       // send status response
 *     } else {
 *       next();
 *     }
 *   });
 */

// Let express routes handle requests that were not handled
// by any of the middleware registered above.
// This way LoopBack REST and API Explorer take precedence over
// express routes.
app.use(app.router);

// The static file server should come after all other routes
// Every request that goes through the static middleware hits
// the file system to check if a file exists.
app.use(loopback.static(path.join(__dirname, 'public')));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

/*
 * 4. Setup error handling strategy
 */

/*
 * EXTENSION POINT
 * Add your custom error reporting middleware here
 * Example:
 *   app.use(function(err, req, resp, next) {
 *     console.log(req.url, ' failed: ', err.stack);
 *     next(err);
 *   });
 */

// The ultimate error handler.
app.use(loopback.errorHandler());

/*
 * 6. Enable access control and token based authentication.
 */

var swaggerRemote = app.remotes().exports.swagger;
if (swaggerRemote) swaggerRemote.requireToken = false;

app.enableAuth();

/*
 * 7. Optionally start the server
 *
 * (only if this module is the main module)
 */

app.start = function() {
  return app.listen(function() {
    var baseUrl = 'http://' + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
  });
};

if(require.main === module) {
  app.start();
}
