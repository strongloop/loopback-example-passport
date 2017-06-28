'use strict';

var config = require('../../server/config.json');
var path = require('path');

module.exports = function(user) {
  user.afterRemote('create', function(context, user, next) {
    console.log('< afterRemote create triggered');
    if (context.res.render) {
      context.res.render('response', {
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link ' +
            'before logging in.',
        redirectTo: '/',
        redirectToLinkText: 'Log in',
      });
    } else {
      next();
    }
  });

  user.observe('after save', function(context, next) {
    console.log('> user.afterSave triggered');

    if (context.isNewInstance && !context.instance.emailVerified) {
      var options = {
        type: 'email',
        to: context.instance.email,
        from: 'noreply@loopback.com',
        subject: 'Thanks for registering.',
        template: path.resolve(__dirname, '../../server/views/verify.ejs'),
        redirect: '/verified',
        user: context.instance,
      };

      context.instance.verify(options, function(err, response) {
        if (err) {
          context.Model.deleteById(context.instance.id);
          return next(err);
        }

        console.log('> verification email sent:', response);
        return next();
      });
    } else {
      return next();
    }
  });
};
