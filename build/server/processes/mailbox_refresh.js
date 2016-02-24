// Generated by CoffeeScript 1.10.0
var MailboxRefresh, MailboxRefreshDeep, MailboxRefreshFast, Process, log, ramStore,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Process = require('./_base');

log = require('../utils/logging')({
  prefix: 'process/refreshpick'
});

ramStore = require('../models/store_account_and_boxes');

MailboxRefreshFast = require('./mailbox_refresh_fast');

MailboxRefreshDeep = require('./mailbox_refresh_deep');

module.exports = MailboxRefresh = (function(superClass) {
  var getProgress;

  extend(MailboxRefresh, superClass);

  function MailboxRefresh() {
    this.refreshDeep = bind(this.refreshDeep, this);
    this.refreshFast = bind(this.refreshFast, this);
    return MailboxRefresh.__super__.constructor.apply(this, arguments);
  }

  MailboxRefresh.prototype.code = 'mailbox-refresh';

  getProgress = function() {
    var ref;
    return ((ref = MailboxRefresh.actualRefresh) != null ? ref.getProgress() : void 0) || 0;
  };

  MailboxRefresh.prototype.initialize = function(options, callback) {
    var account, fastSupport, mailbox;
    this.mailbox = mailbox = options.mailbox;
    account = ramStore.getAccount(mailbox.accountID);
    this.shouldNotif = false;
    if (!account) {
      return callback(null);
    }
    if (indexOf.call(mailbox.attribs, "\\Noselect") >= 0) {
      return callback(null);
    }
    log.debug("refreshing box");
    fastSupport = account.supportRFC4551 && mailbox.lastHighestModSeq;
    if (fastSupport && !options.deep) {
      return this.refreshFast((function(_this) {
        return function(err) {
          if (err && err === MailboxRefreshFast.algorithmFailure || err === MailboxRefreshFast.tooManyMessages) {
            log.warn("refreshFast fail " + err.Symbol + ", trying deep");
            _this.options.storeHighestModSeq = true;
            return _this.refreshDeep(callback);
          } else if (err) {
            return callback(err);
          } else {
            return callback(null);
          }
        };
      })(this));
    } else {
      if (options.deep) {
        log.debug("force deep refresh");
      } else if (!account.supportRFC4551) {
        log.debug("account doesnt support RFC4551");
      } else if (!mailbox.lastHighestModSeq) {
        log.debug("no highestmodseq, first refresh ?");
        this.options.storeHighestModSeq = true;
      }
      return this.refreshDeep(callback);
    }
  };

  MailboxRefresh.prototype.refreshFast = function(callback) {
    this.actualRefresh = new MailboxRefreshFast(this.options);
    return this.actualRefresh.run((function(_this) {
      return function(err) {
        _this.shouldNotif = _this.actualRefresh.shouldNotif;
        return callback(err);
      };
    })(this));
  };

  MailboxRefresh.prototype.refreshDeep = function(callback) {
    this.actualRefresh = new MailboxRefreshDeep(this.options);
    return this.actualRefresh.run((function(_this) {
      return function(err) {
        _this.shouldNotif = _this.actualRefresh.shouldNotif;
        return callback(err);
      };
    })(this));
  };

  return MailboxRefresh;

})(Process);
