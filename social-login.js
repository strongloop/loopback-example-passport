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
      user.linkedAccounts(function (err, accounts) {
        user.accounts = accounts;
        done(err, user);
      });
    });
  });
});

module.exports = function configure(name, options) {
  options = options || {};
  var link = options.link;
  var AuthStrategy = require(options.module)[options.strategy || 'Strategy'];

  var clientID = options.clientID;
  var clientSecret = options.clientSecret;
  var callbackURL = options.callbackURL;
  var authPath = options.authPath || ((link ? '/link/' : '/auth/') + name);
  var callbackPath = options.callbackPath || ((link ? '/link/' : '/auth/') + name + '/callback');
  var successRedirect = options.successRedirect || (link ? '/link/account' : '/auth/account');
  var failureRedirect = options.failureRedirect || (link ? '/link.html' : '/login.html');
  var scope = options.scope;

  var session = !!options.session;

  passport.use(name, new AuthStrategy({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      if (link) {
        if (req.user) {
          app.models.userCredential.link(req.user.id, name, 'oAuth 2.0', profile,
            {accessToken: accessToken, refreshToken: refreshToken}, done);
        } else {
          done('No user is logged in');
        }
      } else {
        app.models.userIdentity.login(name, 'oAuth 2.0', profile,
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
    app.get(callbackPath, passport.authorize(name, {
      session: session,
      // successReturnToOrRedirect: successRedirect,
      successRedirect: successRedirect,
      failureRedirect: failureRedirect }),
      // passport.authorize doesn't handle redirect
      function (req, res, next) {
        res.redirect(successRedirect);
      }, function (err, req, res, next) {
        res.redirect(failureRedirect);
      });
  } else {
    app.get(callbackPath,
      passport.authenticate(name, {
        session: session,
        // successReturnToOrRedirect: successRedirect,
        successRedirect: successRedirect,
        failureRedirect: failureRedirect }));
  }
}
