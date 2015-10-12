/* A set of stateless functions implementing aspects of the perceptron learning process. */
define(function () {
    'use strict';
    
    function countCorrectlyClassified(elements, classifications){
        return elements.reduce(function(count, element, i){
            if(element.class === classifications[i]){
                count++;
            }
            return count;
        },0);
    }
    
    function adjustClassifier(points, currentClassifications, w){
        points.forEach(function(point, i){
            if(point.class!==currentClassifications[i]){ // if i is wrongly classified
                var coeff = (point.class === 1)? 1 : -1;
                w.x += coeff * point.x;
                w.y += coeff * point.y;
                w.bias += coeff * point.weight;
            }
        });
        return w;
    }
    
    function getClassification(points, w){
        var slope = w.y / w.x;
        return points.map(function(point){
            var lineAtPointX = point.x * slope;
            return (lineAtPointX+w.bias>point.y)? 1: 0;
        });
    }
    
    return {
        countCorrectlyClassified: countCorrectlyClassified,
        adjustClassifier: adjustClassifier,
        getClassification: getClassification
    };
});