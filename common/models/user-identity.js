'use strict';

module.exports = function(userIdentity) {
  /*
   * Keep user credentials in sync after saving a user-identity
   * It checks if a UserCredentialModel with the same provider and external ID exists for that user
   * It assumes that the providername of userIdentity has suffix `-login`and of userCredentials has suffix `-link`
   *
   * @param Loopback context object
   * @param next middleware function
   * */
  userIdentity.observe('after save',
  function checkPassportUserCredentials(ctx, next) {
    var data = JSON.parse(JSON.stringify(ctx.instance));

    data.provider = data.provider.replace('-login', '-link');
    delete data.id; // has to be auto-increment

    var PassportUserCredential = userIdentity.app.models.userCredential;
    var filter = {
      where: {
        userId: data.userId,
        provider: data.provider,
        externalId: data.externalId,
      },
    };
    PassportUserCredential.find(filter, function(err, res) {
      if (err) console.log(err);

      if (res.length < 1) {
        PassportUserCredential.create(data, next);
      } else {
        next();
      }
    });
  });
};
