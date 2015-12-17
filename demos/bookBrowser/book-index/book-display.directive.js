'use strict';

/**
* This <book-display> directive can be used to display a showcase of books.
* You can bind to the following attributes as input params:
* - limit: number of books to be displayed on one page
* - [optional] filters: an object to filter the books by
*   (can contain id, category, genre and search query string)
* - [optional] paging: if true, result sets bigger than limit receive paging controls
* It uses the books service to fetch book data based on the provided filters.
**/
angular.module('bookBrowserApp').directive('bookDisplay', function(books){
  return {
    templateUrl: 'book-index/book-display-template.html',
    restrict: 'E',
    scope: {
        filters: '=',
        limit: '=',
        paging: '='
    },
    link: function($scope) {
        $scope.results = {
            books: []
        };
        
        $scope.currentOffset = 0;
        $scope.previousPage = function(){
            $scope.currentOffset = Math.max(0,$scope.currentOffset-$scope.limit);
        };
        $scope.nextPage = function(){
            if($scope.currentOffset+$scope.limit<$scope.results.books.length-1){
                $scope.currentOffset = $scope.currentOffset+$scope.limit;
            }
        };
        
        function updateResults(){
            $scope.currentOffset = 0;
            var filters = {};
            if($scope.filters){
                filters.id = $scope.filters.id;
                filters.search = $scope.filters.search;
                if($scope.filters.category){
                    filters.category = $scope.filters.category.searchValue;
                }
                if($scope.filters.genre){
                    filters.genre = $scope.filters.genre.searchValue;
                }
            }
            books.get(filters).then(function(data){
                $scope.results.books = data;
            });
        }
        
        updateResults();
        
        $scope.humanizeDate = function(dateString){
            return moment(dateString).fromNow();
        };
        
        $scope.$watch('filters', function(){
            updateResults();
        }, true);
    }
  };
});