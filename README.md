# loopback-example-passport

LoopBack example for [loopback-passport](https://github.com/strongloop/loopback-passport) module. It demonstrates how to use
LoopBack's user/userIdentity/userCredential models and [passport](http://passportjs.org) to interact with other auth providers.

- Log in or sign up to LoopBack using third party providers (aka social logins)
- Link third party accounts with a LoopBack user (for example, a LoopBack user can have associated facebook/google accounts to retrieve pictures).

# How to run the application

```
git clone git@github.com:strongloop/loopback-example-passport.git
cd loopback-example-passport
npm install
```

## Get your client ids/secrets from facebook & google

- https://developers.facebook.com/apps
- https://console.developers.google.com/project

## Create providers.json

- Copy providers.json.template to providers.json
- Update providers.json with your own values for clientID/clientSecret

## Run the application

```
node . 
```

Open your browser to http://127.0.0.1:3000

