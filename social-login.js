var app = require('./app');

var passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());
// Serialization and deserialization is only required if passport session is
// enabled

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  // Look up the user instance by id
  app.models.user.findById(id, function (err, user) {
    if (err || !user) {
      return done(err, user);
    }
    user.identities(function (err, identities) {
      user.profiles = identities;
      done(err, user);
    });
  });
});

module.exports = function configure(name, options) {
  options = options || {};

  var AuthStrategy = require(options.module)[options.strategy || 'Strategy'];

  var provider = options.provider || provider;
  var clientID = options.clientID;
  var clientSecret = options.clientSecret;
  var callbackURL = options.callbackURL;
  var authPath = options.authPath || ('/auth/' + provider);
  var callbackPath = options.callbackPath || ('/auth/' + provider + '/callback');
  var successRedirect = options.successRedirect || '/';
  var failureRedirect = options.failureRedirect || '/';
  var scope = options.scope;

  var session = !!options.session;
  var link = options.link;

  passport.use(name, new AuthStrategy({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      if (link) {
        app.models.userCredential.link(req.user.id, provider, 'oAuth 2.0', profile,
          {accessToken: accessToken, refreshToken: refreshToken}, done);
      } else {
        app.models.userIdentity.login(provider, 'oAuth 2.0', profile,
          {accessToken: accessToken, refreshToken: refreshToken}, done);
      }
    }
  ));

  /*
   * Redirect the user to Facebook for authentication.  When complete,
   * Facebook will redirect the user back to the application at
   * /auth/facebook/callback with the authorization code
   */
  if (link) {
    app.get(authPath, passport.authorize(name, {scope: scope, session: session}));
  } else {
    app.get(authPath, passport.authenticate(name, {scope: scope, session: session}));
  }

  /*
   * Facebook will redirect the user to this URL after approval. Finish the
   * authentication process by attempting to obtain an access token using the
   * authorization code. If access was granted, the user will be logged in.
   * Otherwise, authentication has failed.
   */
  if (link) {
    app.get(callbackPath,
      passport.authorize(name, { session: session,
        successRedirect: successRedirect,
        failureRedirect: failureRedirect }));
  } else {
    app.get(callbackPath,
      passport.authenticate(name, { session: session,
        successRedirect: successRedirect,
        failureRedirect: failureRedirect }));
  }
}
