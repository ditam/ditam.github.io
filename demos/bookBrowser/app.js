'use strict';

angular
  .module('bookBrowserApp', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ui.bootstrap',
    'ui.select'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/:category?:genre?', {
        templateUrl: 'book-index/book-index.html',
        controller: 'BookIndexCtrl'
      })
      .when('/details/:bookId?', {
        templateUrl: 'book-details/book-details.html',
        controller: 'BookDetailsCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
