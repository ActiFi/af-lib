//
// RETURNS LIST OF ENABLED/DISABLED MODULES IN THE SYSTEM
//
angular.module('af.redirectionManager', ['_', 'af.util', 'af.storage', 'af.appCatch', 'af.moduleManager', 'af.appEnv', 'af.appTenant', 'af.authManager'])

    .service('afRedirectionManager', function($q, $log, $window, $location, $httpParamSerializer, afUtil, appEnv, afStorage, appCatch, _, afModuleManager, appTenant, afAuthManager) {

      var go = function(url, options){
        options = options || {}; // { body, replace, newWindow }
        if(options.replace)
          $window.location.replace(to); // no history state...
        if(options.newWindow)
          afUtil.postToUrl(url, options.body, true); // new window...
        else
          $window.location.href = to;
      };

      var missingParams = function(params, requiredParams){
        var missingParams = [];
        _.each(requiredParams, function(requiredParam){
          if(!_.has(params, requiredParam))
            missingParams.push(requiredParam);
        });
        if(missingParams.length)
          return missingParams.join(',');
        return false
      };

      var convertToHttpParams = function(params, paramsToAdd){
        var params = _.extend({ from:appEnv.APP() }, paramsToAdd, params);
        // return nothing if params is empty...
        return _.keys(params).length ? '?'+$httpParamSerializer(params):'';
      };



      var afRedirectionManager;
      return afRedirectionManager = {

        //
        // MAIN REDIRECT FUNCTIONS
        //
        redirect:function(redirectKey, params, options) {
          var defer = $q.defer();
          redirectKey = ('' + redirectKey).toLowerCase();


          // PUBLIC REDIRECTS
          if(redirectKey == 'auth'){
            var queryString = convertToHttpParams(params);
            go('/auth/#/login'+queryString, options);


          // MUST BE LOGGED IN....
          } else if(!afAuthManager.isLoggedIn()) {

            // whoops.. need to be logged in...
            var error = 'Invalid Session. Redirect to '+redirectKey+' failed.';
            appCatch.send(error);
            // send them to login page....
            afRedirectionManager.invalidSession({ redirect:redirectKey || '' });

          } else {

            switch(redirectKey) {

              //
              // PORTAL -> standard login
              case 'roadmap':
                var queryString = convertToHttpParams(params);
                go('/portal/login-window.php/#/'+queryString, options);
                break;

              // METRICS
              // eg. /metrics/#/login?from=auth&sessionToken=abc123
              case 'metrics':
                var queryString = convertToHttpParams(params, { sessionToken: afAuthManager.sessionToken() });
                go('/metrics/#/login'+queryString, options); // page that has code that mimics portals login page.
                break;

              //
              // PROCESS PRO
              case 'processpro':
                var queryString = convertToHttpParams(params);
                go('/processpro/#/'+queryString, options); // page that has code that mimics portals login page.
                break;

              //
              // ADMIN
              case 'admin':
                var queryString = convertToHttpParams(params);
                go('/admin/#/'+queryString, options); // page that has code that mimics portals login page.
                break;

              //
              // ROADMAP EMAIL ROADMAP UPDATER
              case 'rmupdater':
                var missing = missingParams(params, ['dateFrom']);
                if(missing) {
                  defer.reject('Redirection ['+redirectKey+'] not found.');
                } else {
                  var queryString = convertToHttpParams({ dateFrom: params.dateFrom });
                  go('/act/rmupdater/#/rm/updater'+queryString, options);
                }
                break;

              default:
                appCatch('Redirection ['+redirectKey+'] not found.');
                defer.reject('Redirection ['+redirectKey+'] not found.');
            }

          }
          return defer.promise;
        },

        // attempts to redirect user to another actifi app(module)
        changeApp:function(desiredModule){

          // whats available to user
          var availableModules = afModuleManager.getUserAccessibleModules();
          if(availableModules.length == 0)
            return $q.reject([]);

          // if no specific app defined, log them into first userAccessible app
          if (!desiredModule) {
            var defaultModule = afModuleManager.getDefaultModule();
            if(!defaultModule)
              return $q.reject([]);
            desiredModule = defaultModule.key;
          }

          // ensure lowercase
          desiredModule = ('' + desiredModule).toLowerCase();

          // Make sure they can actually log into the desired module
          var isAvailable = _.find(availableModules, {key:desiredModule});
          if(!isAvailable)
            return $q.reject(availableModules);

          // actually do the redirect...
          return afRedirectionManager.redirect(desiredModule)
            .catch(function(reason){
              return $q.reject(availableModules);
            });
        },


        goToPortal:function(page, hash, hui, params, options){
          params = params || {};
          params.hui = hui === false ? false:true;
          params.page = page;
          if(hash) params.hash = hash;
          afRedirectionManager.redirect('portal', params, options)
        },

        // redirect to auth because of session issues...
        logout:function(params, options){
          params = params || {};
          params.action = 'logout';
          afRedirectionManager.redirect('auth', params, options);
        },
        invalidSession:function(params, options){
          params = params || {};
          params.action = 'invalidsession';
          afRedirectionManager.redirect('auth', params, options);
        }

      }

    });