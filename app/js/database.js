'use strict';

angular.module('philms.services', ['ngResource'])
  .service('database', ['$resource', function ($resource) {
    var Films = $resource('/films');
    var Index = $resource('/filmIndex');
    var Film = $resource('/film/:id');
    return {
      Film: Film,
      getIndex: Index.query.bind(Index),
      getAll: Films.query.bind(Films)
    };
  }]);