// Generated by CoffeeScript 1.8.0
var Account, CozyInstance, Promise, fixtures;

CozyInstance = require('../models/cozy_instance');

Account = require('../models/account');

Promise = require('bluebird');

fixtures = require('cozy-fixtures');

module.exports.main = function(req, res, next) {
  return Promise.all([
    CozyInstance.getLocalePromised()["catch"](function(err) {
      return 'en';
    }), Account.getAllPromised().map(function(account) {
      return account.includeMailboxes();
    })
  ]).spread(function(locale, accounts) {
    return "window.locale = \"" + locale + "\";\nwindow.accounts = " + (JSON.stringify(accounts)) + ";";
  })["catch"](function(err) {
    console.log(err.stack);
    return "console.log(\"" + err + "\");\nwindow.locale = \"en\"\nwindow.accounts = []";
  }).then(function(imports) {
    return res.render('index.jade', {
      imports: imports
    });
  });
};

module.exports.loadFixtures = function(req, res, next) {
  return fixtures.load({
    silent: true,
    callback: function(err) {
      if (err != null) {
        return next(err);
      } else {
        return res.send(200, {
          message: 'LOAD FIXTURES SUCCESS'
        });
      }
    }
  });
};
