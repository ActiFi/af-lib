//
// SIMPLE WRAPPER AROUND AMPLIFY.STORE
//
angular.module('af.storage', [ '_', 'amplify' ])
  .service('afStorage', function(amplify, _) {
    var afStorage = null;
    return afStorage = {
      // STORE
      store:function(key, value, options){
        if(_.isNumber(options)) options = { expires:options };
        return amplify.store(key, value, options);
      },
      // CLEAR
      clear: function(key) {
        // clear one key
        if(key)
          return amplify.store(key, null);
        // clear all
        _.each(amplify.store(), function(value, key){
          amplify.store(key, null);
        });
      }
    };
    return afStorage;
  });
