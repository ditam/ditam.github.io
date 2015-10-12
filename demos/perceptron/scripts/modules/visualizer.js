/* Stateless helper functions to visualize the perceptron process on a HTML5 canvas. Canvas 2D context is to be supplied as last param. */
define(function () {
    'use strict';
    
    var CONSTANTS = Object.freeze({
        ELEMENT_RADIUS: 5,
        ELEMENT_OUTLINE_RADIUS: 7,
        COLORS: {
            CLASS_A: 'black',
            CLASS_B: 'blue',
            CORRECT_CLASS: 'green',
            INCORRECT_CLASS: 'red'
        }
    });
    
    function clearCanvas(context){
        context.clearRect(0,0,context.canvas.clientWidth,context.canvas.clientHeight);
    }

    function drawPoint(point, classification, context){
        context.beginPath();
        context.arc(point.x, point.y, CONSTANTS.ELEMENT_RADIUS, 0, Math.PI*2);
        context.fillStyle = (point.class > 0)? CONSTANTS.COLORS.CLASS_A : CONSTANTS.COLORS.CLASS_B;
        context.fill();
        context.closePath();
        
        context.beginPath();
        context.arc(point.x, point.y, CONSTANTS.ELEMENT_OUTLINE_RADIUS, 0, Math.PI*2);
        context.strokeStyle = (point.class === classification)? CONSTANTS.COLORS.CORRECT_CLASS : CONSTANTS.COLORS.INCORRECT_CLASS;
        context.stroke();
        context.closePath();
    }
    
        
    function drawClassifiedElements(elements, classifications, context){
        elements.forEach(function(element,i){
            drawPoint(element, classifications[i], context);
        });
    }
    
    function drawClassifierLines(bufferSize, wBuffer, context){
        for(var i=0;i<bufferSize && i<wBuffer.length;i++){
            var w = wBuffer[i];
            var slope = w.y / w.x;        
            var endIntercept = context.canvas.clientWidth * slope;            
            var opacity = 1/Math.min(bufferSize,wBuffer.length)*(i+1);
            
            context.beginPath();
            context.moveTo(0,0+w.bias);
            context.strokeStyle = 'rgba(0,0,0,'+opacity+')';
            context.lineTo(context.canvas.clientWidth, endIntercept+w.bias);
            context.stroke();
            context.closePath();
        }
    }
    
    return {
        clearCanvas: clearCanvas,
        drawClassifiedElements: drawClassifiedElements,
        drawClassifierLines: drawClassifierLines
    };
});