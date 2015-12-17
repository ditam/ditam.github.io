'use strict';

angular.module('bookBrowserApp')
  .controller('BookDetailsCtrl', function ($scope, $routeParams, books) {
  
    books.get({id: $routeParams.bookId}).then(function(data){
        $scope.book = data[0];
    });
    
  });
