'use strict';

/* Controllers */

angular.module('philms.controllers', ['ng', 'philms.services', 'philms.filters'])
  .controller('PhilmsCtrl', ['$scope', '$filter', function ($scope, $filter) {
    $scope.genres = ['Comedy', 'Action', 'Thriller', 'Crime', 'Drama', 'Adventure', 'Sci-Fi', 'Fantasy'];
    $scope.filteringGenres = {
      //'Comedy': 'active'
    };
    //$scope.genreFilter
    $scope.filmsFiltered = $scope.films;
    function filterFilms() {
      return $scope.genres.reduce(function (films, genre) {
        return !$scope.filteringGenres[genre] ? films : $filter('genreFilter')(films, genre);
      }, $scope.films);
    }

    $scope.toggleGenreFilter = function (genre) {
      $('.genre' + genre).toggleClass('active');
      if ($scope.filteringGenres[genre]) {
        $scope.filteringGenres[genre] = '';
      } else {
        $scope.filteringGenres[genre] = 'active';
      }
      $scope.filmsFiltered = filterFilms();
    };
  }])
  .controller('FilmCtrl', ['$scope', '$routeParams', 'database', function ($scope, $routeParams, database) {
    $scope.film = database.Film.get({id: $routeParams.filmID});

  }]);