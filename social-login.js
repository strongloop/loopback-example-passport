var app = require('./app');

var passport = require('passport');

app.use(passport.initialize());

module.exports = function configure(provider, options) {
  options = options || {};

  var AuthStrategy = require(options.module)[options.strategy || 'Strategy'];

  var clientID = options.clientID;
  var clientSecret = options.clientSecret;
  var callbackURL = options.callbackURL;
  var authPath = options.authPath || ('/auth/' + provider);
  var callbackPath = options.callbackPath || ('/auth/' + provider + '/callback');
  var successRedirect = options.successRedirect || '/';
  var failureRedirect = options.failureRedirect || '/';
  var scope = options.scope;

  var session = !!options.session;
  if(options.session) {
    app.use(passport.session());
    // Serialization and deserialization is only required if passport session is
    // enabled

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      // Look up the user instance by id
      app.models.user.findById(id, function(err, user) {
        if(err || !user) {
          return done(err, user);
        }
        user.identities(function(err, identities) {
          user._identities = identities;
          done(err, user);
        });
      });
    });
  }

  passport.use(new AuthStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    /*
    console.log(accessToken, profile);
    process.nextTick(function() {
      done && done(null, {id: '123'});
    });
    */

    app.models.userIdentity.findOne({where: {
      provider: provider,
      externalId: profile.id
    }}, function(err, identity) {
      if(err) {
        return done(err);
      }
      if(identity) {
        console.log(identity.userId);
        // Find the user for the given identity
        return identity.user(done);
      }
      console.log(profile);
      // Let's create a user for that
      var email = profile.emails && profile.emails[0].value;
      app.models.user.create({
        username: provider + '.' + (profile.username || profile.id),
        password: accessToken,
        email: email
      }, function(err, u) {
        if(err) {
          console.error(err);
          return done(err);
        }
        app.models.userIdentity.create({
          provider: provider,
          externalId: profile.id,
          authScheme: 'oAuth 2.0',
          profile: profile,
          credentials: {
            accessToken: accessToken,
            refreshToken: refreshToken
          },
          userId: u.id
        }, function(err, i) {
          done(err, u);
        });
      });
    });
    }
  ));

 /*
  * Redirect the user to Facebook for authentication.  When complete,
  * Facebook will redirect the user back to the application at
  * /auth/facebook/callback with the authorization code
  */
  app.get(authPath, passport.authenticate(provider, {scope: scope, session: session}));

 /*
  * Facebook will redirect the user to this URL after approval. Finish the
  * authentication process by attempting to obtain an access token using the
  * authorization code. If access was granted, the user will be logged in.
  * Otherwise, authentication has failed.
  */
  app.get(callbackPath,
    passport.authenticate(provider, { session: session,
      successRedirect: successRedirect,
      failureRedirect: failureRedirect }));
}
