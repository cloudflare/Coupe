(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Client, Evented, Frame, Promise, cache, clientId, createClient, debug, frame,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Promise = require('./promise').Promise;

Evented = require('./events').Evented;

clientId = (Math.random() * 1000000) | 0;

debug = require('debug')("bus:client(" + clientId + ")");

Frame = (function(_super) {
  __extends(Frame, _super);

  function Frame(opts) {
    this.opts = opts;
    this.ready = new Promise;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', this.createIframe.bind(this));
    } else {
      this.createIframe();
    }
  }

  Frame.prototype.createIframe = function() {
    this.frame = document.createElement('iframe');
    this.frame.style.display = 'none';
    this.addListener(this.frame);
    this.frame.src = "" + opts.host + "#" + clientId;
    return document.body.appendChild(this.frame);
  };

  Frame.prototype.addListener = function(frame) {
    return window.addEventListener('message', (function(_this) {
      return function(_arg) {
        var data, source;
        data = _arg.data, source = _arg.source;
        if (source !== frame.contentWindow) {
          return;
        }
        switch (data.type) {
          case 'bus:ready':
            debug("Ready");
            return _this.ready.resolve();
          case 'bus:set':
            debug("Received", data.key);
            _this.trigger('set', data);
            return _this.trigger("set:" + data.key, data);
        }
      };
    })(this));
  };

  Frame.prototype.send = function(body) {
    return this.ready.then((function(_this) {
      return function() {
        debug("Sending", body);
        return _this.frame.contentWindow.postMessage(body, '*');
      };
    })(this));
  };

  Frame.prototype.client = function(siteId) {
    return new Client(this, siteId);
  };

  return Frame;

})(Evented);

Client = (function(_super) {
  __extends(Client, _super);

  function Client(frame, opts) {
    var _base;
    this.frame = frame;
    this.opts = opts;
    (_base = this.opts).siteId || (_base.siteId = '');
    this.frame.on('set', (function(_this) {
      return function(data) {
        var key, siteId, splitPos;
        splitPos = data.key.indexOf(':');
        siteId = data.key.substring(0, splitPos);
        key = data.key.substring(splitPos + 1);
        if (siteId === _this.opts.siteId) {
          data.key = key;
          _this.trigger('set', data);
          return _this.trigger("set:" + key, data);
        }
      };
    })(this));
  }

  Client.prototype.set = function(key, value) {
    key = "" + this.opts.siteId + ":" + key;
    debug("Setting", key, "to", value);
    return this.frame.send({
      type: 'bus:set',
      key: key,
      value: value
    });
  };

  Client.prototype.clear = function(key) {
    key = "" + this.opts.siteId + ":" + key;
    debug("Clearing", key);
    return this.frame.send({
      type: 'bus:clear',
      key: key
    });
  };

  Client.prototype.flash = function(key, value) {
    key = "" + this.opts.siteId + ":" + key;
    debug("Flashing", key, "to", value);
    return this.frame.send({
      type: 'bus:flash',
      key: key,
      value: value
    });
  };

  return Client;

})(Evented);

cache = {};

frame = null;

createClient = function(opts) {
  if (typeof opts === 'string') {
    opts = {
      siteId: opts
    };
  }
  if (!cache[siteId]) {
    if (!frame) {
      frame = new Frame(opts);
    }
    cache[siteId] = new Client(frame, opts);
  }
  return cache[siteId];
};

module.exports = {
  Client: Client,
  Frame: Frame,
  createClient: createClient
};


},{"./events":2,"./promise":3,"debug":4}],2:[function(require,module,exports){
var Evented,
  __slice = [].slice;

Evented = (function() {
  function Evented() {}

  Evented.prototype.on = function(event, handler, ctx, once) {
    var _base;
    if (once == null) {
      once = false;
    }
    if (this.bindings == null) {
      this.bindings = {};
    }
    if ((_base = this.bindings)[event] == null) {
      _base[event] = [];
    }
    return this.bindings[event].push({
      handler: handler,
      ctx: ctx,
      once: once
    });
  };

  Evented.prototype.once = function(event, handler, ctx) {
    return this.on(event, handler, ctx, true);
  };

  Evented.prototype.off = function(event, handler) {
    var i, _ref, _results;
    if (((_ref = this.bindings) != null ? _ref[event] : void 0) == null) {
      return;
    }
    if (handler == null) {
      return delete this.bindings[event];
    } else {
      i = 0;
      _results = [];
      while (i < this.bindings[event].length) {
        if (this.bindings[event][i].handler === handler) {
          _results.push(this.bindings[event].splice(i, 1));
        } else {
          _results.push(i++);
        }
      }
      return _results;
    }
  };

  Evented.prototype.trigger = function() {
    var args, ctx, event, handler, i, once, _ref, _ref1, _results;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if ((_ref = this.bindings) != null ? _ref[event] : void 0) {
      i = 0;
      _results = [];
      while (i < this.bindings[event].length) {
        _ref1 = this.bindings[event][i], handler = _ref1.handler, ctx = _ref1.ctx, once = _ref1.once;
        handler.apply(ctx != null ? ctx : this, args);
        if (once) {
          _results.push(this.bindings[event].splice(i, 1));
        } else {
          _results.push(i++);
        }
      }
      return _results;
    }
  };

  return Evented;

})();

module.exports = {
  Evented: Evented
};


},{}],3:[function(require,module,exports){
var Promise;

Promise = (function() {
  function Promise() {
    this.ready = false;
    this.waiting = [];
  }

  Promise.prototype.then = function(fn) {
    if (this.ready) {
      return fn();
    } else {
      return this.waiting.push(fn);
    }
  };

  Promise.prototype.resolve = function() {
    var fn, _i, _len, _ref;
    this.ready = true;
    if (this.waiting != null) {
      _ref = this.waiting;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fn = _ref[_i];
        fn();
      }
      return this.waiting = [];
    }
  };

  return Promise;

})();

module.exports = {
  Promise: Promise
};


},{}],4:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":5}],5:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":6}],6:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],7:[function(require,module,exports){
var client, createClient;

createClient = require('../coffee/client').createClient;

client = null;

describe('Bus', function() {
  beforeEach(function() {
    return client = createClient({
      host: "https://bus.eager.io"
    });
  });
  it('should create a client', function(done) {
    return client.frame.ready.then(function() {
      expect(true).toBe(true);
      return done();
    });
  });
  it('should send messages', function(done) {
    var client2;
    client2 = createClient(0);
    client.on('set:message', function(_arg) {
      var value;
      value = _arg.value;
      expect(value).toBe('5');
      return done();
    });
    return client2.set('message', '5');
  });
  it('should fire events on existing values', function(done) {
    var client2;
    client.set('existing', 5);
    client2 = createClient(0);
    return client2.on('set:existing', function(_arg) {
      var value;
      value = _arg.value;
      expect(value).toBe('5');
      return done();
    });
  });
  return it('should not get events from other sites', function() {
    var client2;
    client2 = createClient(1);
    client2.on('set:message', function(_arg) {
      var value;
      value = _arg.value;
      return expect(true).toBe(false);
    });
    return client.set('message', '5');
  });
});


},{"../coffee/client":1}]},{},[7])