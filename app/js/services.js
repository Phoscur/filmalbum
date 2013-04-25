'use strict';

angular.module('philms.services', ['ngResource'])
  .service('database', ['$resource', function ($resource) {
    var Films = $resource('/films');
    var Film = $resource('/film/:id');
    return {
      Film: Film,
      getAll: Films.query.bind(Films)
    };
  }]);