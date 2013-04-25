'use strict';


angular.module('philms.filters', [])
  .filter('genreFilter', function () {
    return function (input, genre) {
      return input.filter(function (film) {
        return film.genres && film.genres.indexOf(genre) > -1;
      })
    };
  });
