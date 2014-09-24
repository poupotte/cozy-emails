// Generated by CoffeeScript 1.8.0
var ImapProcess, ImapReporter, ImapScheduler, Mailbox, Message, Promise, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

ImapScheduler = require('./imap_scheduler');

ImapReporter = require('./imap_reporter');

Promise = require('bluebird');

Message = require('../models/message');

Mailbox = require('../models/mailbox');

_ = require('lodash');

module.exports = ImapProcess = {};

ImapProcess.fetchBoxesTree = function(account) {
  return ImapScheduler.instanceFor(account).doASAP(function(imap) {
    console.log("FETCH BOX TREE");
    return imap.getBoxes();
  });
};

ImapProcess.fetchAccount = function(account) {
  return Mailbox.getBoxes(account.id).then(function(boxes) {
    return Promise.serie(boxes, function(box) {
      return ImapProcess.fetchMailbox(account, box)["catch"](function(err) {
        return console.log("FAILED TO FETCH BOX", box.path, err.stack);
      });
    });
  });
};

ImapProcess.fetchMailbox = function(account, box, limitByBox) {
  var reporter;
  if (limitByBox == null) {
    limitByBox = false;
  }
  reporter = ImapReporter.addUserTask({
    code: 'diff',
    total: 1,
    box: box.path
  });
  return ImapScheduler.instanceFor(account).doLater(function(imap) {
    return imap.openBox(box.path).tap(function() {
      return reporter.addProgress(0.1);
    }).then(function(imapbox) {
      if (!imapbox.persistentUIDs) {
        throw new Error('UNPERSISTENT UID NOT SUPPORTED');
      }
      if (box.uidvalidity && imapbox.uidvalidity !== box.uidvalidity) {
        throw new Error('UID VALIDITY HAS CHANGED');
      }
    }).then(function() {
      return Promise.all([
        imap.search([['ALL']]).tap(function() {
          return reporter.addProgress(0.5);
        }), Message.getUIDs(box.id).tap(function() {
          return reporter.addProgress(0.3);
        })
      ]);
    });
  }).spread(function(imapIds, cozyIds) {
    var ids, toDo, toFetch, toRemove;
    toFetch = _.difference(imapIds, cozyIds.map(function(ids) {
      return ids[1];
    }));
    toRemove = (function() {
      var _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = cozyIds.length; _i < _len; _i++) {
        ids = cozyIds[_i];
        if (_ref = ids[1], __indexOf.call(imapIds, _ref) < 0) {
          _results.push(ids[0]);
        }
      }
      return _results;
    })();
    console.log('FETCHING', box.path);
    console.log('   in imap', imapIds.length);
    console.log('   in cozy', cozyIds.length);
    console.log('   to fetch', toFetch.length);
    console.log('   to del', toRemove.length);
    console.log('   limited', limitByBox);
    toFetch.reverse();
    if (limitByBox) {
      toFetch = toFetch.slice(0, +limitByBox + 1 || 9e9);
    }
    toDo = [];
    if (toFetch.length) {
      toDo.push(ImapProcess.fetchMails(account, box, toFetch));
    }
    if (toRemove.length) {
      toDo.push(ImapProcess.removeMails(box, toRemove));
    }
    reporter.onDone();
    return Promise.all(toDo);
  });
};

ImapProcess.fetchMails = function(account, box, uids) {
  var reporter;
  reporter = ImapReporter.addUserTask({
    code: 'apply-diff-fetch',
    box: box.path,
    total: uids.length
  });
  return Promise.map(uids, function(id) {
    return ImapProcess.fetchOneMail(account, box, id).tap(function() {
      return reporter.addProgress(1);
    })["catch"](function(err) {
      return reporter.onError(err);
    });
  }).tap(function() {
    return reporter.onDone();
  });
};

ImapProcess.removeMails = function(box, cozyIDs) {
  var reporter;
  reporter = ImapReporter.addUserTask({
    code: 'apply-diff-remove',
    box: box.path,
    total: cozyIDs.length
  });
  return Promise.serie(cozyIDs, function(id) {
    return Message.findPromised(id).then(function(message) {
      return message.removeFromMailbox(box);
    }).tap(function() {
      return reporter.addProgress(1);
    })["catch"](function(err) {
      return reporter.onError(err);
    });
  }).tap(function() {
    return reporter.onDone();
  });
};

ImapProcess.fetchOneMail = function(account, box, uid) {
  var scheduler;
  scheduler = ImapScheduler.instanceFor(account);
  return scheduler.doLater(function(imap) {
    var log, mail;
    log = "MAIL " + box.path + "#" + uid + " ";
    mail = null;
    return imap.openBox(box.path).then(function() {
      return imap.fetchOneMail(uid);
    }).then(function(fetched) {
      mail = fetched;
      return Message.byMessageId(account.id, mail.headers['message-id']);
    }).then(function(existing) {
      if (existing) {
        return existing.addToMailbox(box, uid).tap(function() {
          return console.log(log + "already in db");
        });
      } else {
        return Message.createFromImapMessage(mail, box, uid).tap(function() {
          return console.log(log + "created");
        });
      }
    });
  });
};
