(function() {
  var myApp;

  myApp = angular.module('af.config', []);

  myApp.service('$config', function($window, $log) {
    var app, config, getPathValue, pluralize;
    app = null;
    pluralize = function(value) {
      var lastChar, lastTwoChar;
      if (!value) {
        return value;
      }
      lastChar = value.charAt(value.length - 1).toLowerCase();
      lastTwoChar = value.slice(value.length - 2).toLowerCase();
      if (lastChar === 'y') {
        return value.slice(0, value.length - 1) + 'ies';
      }
      if (lastTwoChar === 'ch') {
        return value + 'es';
      }
      return value + 's';
    };
    getPathValue = function(object, path) {
      var child, parts;
      parts = path.split('.');
      if (parts.length === 1) {
        return object[parts[0]];
      }
      child = object[parts.shift()];
      if (!child) {
        return child;
      }
      return getPathValue(child, parts.join('.'));
    };
    config = {
      get: function(path, makePlural) {
        var pluralValue, value;
        if (!$window.config) {
          return null;
        }
        if (!path) {
          return $window.config;
        }
        value = getPathValue($window.config, path);
        if (makePlural) {
          pluralValue = getPathValue($window.config, path + '_plural');
          if (pluralValue) {
            return pluralValue;
          }
          return pluralize(value);
        }
        return value;
      },
      getTenant: function() {
        return config.get('tenant');
      },
      getEnv: function() {
        return appEnv.getEnv();
      },
      getTenantIndex: function() {
        return appEnv.getTenantIndex();
      },
      getSubDomain: function() {
        return appEnv.getSubDomain();
      },
      setApp: function(newValue) {
        return app = newValue;
      },
      getApp: function() {
        var parts;
        if (app) {
          return app;
        }
        parts = $window.location.pathname.split('/');
        if (parts.length >= 2) {
          app = parts[1].toLowerCase();
        }
        return app;
      }
    };
    return config;
  });

}).call(this);
