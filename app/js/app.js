'use strict';


// Declare app level module which depends on filters, and services
angular.module('philms', ['philms.services', 'philms.controllers'])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/welcome', {templateUrl: 'partials/welcome.html'});
    $routeProvider.when('/film/:filmID', {templateUrl: 'partials/film.html', controller: 'FilmCtrl'});
    $routeProvider.otherwise({redirectTo: '/welcome'});
  }])
  .run(['$rootScope', 'database', function ($rootScope, database) {

    $rootScope.films = database.getAll();

  }]);