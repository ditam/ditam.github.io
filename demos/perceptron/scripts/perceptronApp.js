requirejs(['modules/domReady', 'modules/seededRandom', 'modules/perceptron', 'modules/visualizer'],
function(domReady, seededRandom, perceptron, visualizer) {
    'use strict';
    var PARAMS = {
        CANVAS: {
            WIDTH: 325,
            HEIGHT: 325
        },
        CLOUD: {
            CENTER_A: {x: 80, y: 80},
            CENTER_B: {x: 220, y: 220},
            PARTICLE_COUNT: 20,
            WIDTH: 100,
            HEIGHT: 100,
            WIDTH_VARIANCE: 100,
            HEIGHT_VARIANCE: 50
        },
        TRAIL_BUFFER: 5,
        RUN_DELAY: 200
    };
    
    function updateParams(){
        seededRandom.setSeed( document.getElementById('randomSeedInput').value || 1 );
        PARAMS.TRAIL_BUFFER             = parseInt(document.getElementById('trailLengthInput').value);
        PARAMS.RUN_DELAY                = parseInt(document.getElementById('runDelayInput').value) || 200;
        PARAMS.CLOUD.PARTICLE_COUNT     = parseInt(document.getElementById('cloudSizeInput').value) || 20;
        PARAMS.CLOUD.WIDTH              = parseInt(document.getElementById('widthInput').value) || 100;
        PARAMS.CLOUD.WIDTH_VARIANCE     = parseInt(document.getElementById('widthVarianceInput').value) || 100;
        PARAMS.CLOUD.HEIGHT             = parseInt(document.getElementById('heightInput').value) || 100;
        PARAMS.CLOUD.HEIGHT_VARIANCE    = parseInt(document.getElementById('heightVarianceInput').value) || 50;
    }
    
    /* Top-level variables:
        - context: for storing the canvas 2D drawing context
        - w: the current linear separator
        - wBuffer: rolling buffer of past linear separators, PARAMS.TRAIL_BUFFER in size.
        - classifications: array of current classifications, CLOUD.PARTICLE_COUNT*2 in size
        - elements: elements to be classified (made up of 2 clouds)
    */
    var context, w, wBuffer, classifications, elements;

    function generateRandomCloudAroundCenter(center){
        var cloud = [];
        var width = PARAMS.CLOUD.WIDTH;
        var height = PARAMS.CLOUD.HEIGHT;
        var wVariance = PARAMS.CLOUD.WIDTH_VARIANCE;
        var hVariance = PARAMS.CLOUD.HEIGHT_VARIANCE;

        var x,y;
        for(var i=0;i<PARAMS.CLOUD.PARTICLE_COUNT;i++){
            x = center.x-width/2+seededRandom.getRandomInt(width);
            y = center.y-height/2+seededRandom.getRandomInt(height)
            cloud.push({
                x: x-(wVariance/2)+seededRandom.getRandomInt(wVariance),
                y: y-(hVariance/2)+seededRandom.getRandomInt(hVariance)
            });
        }
        
        return cloud;
    }
    
    function redrawClassification(){
        visualizer.clearCanvas(context);
        visualizer.drawClassifiedElements(elements, classifications, context);
        visualizer.drawClassifierLines(PARAMS.TRAIL_BUFFER, wBuffer, context);
    }
    
    function updateStatistics(elements, classifications, w){
        var falsePositives = 0;
        var truePositives = 0;
        var falseNegatives = 0;
        var trueNegatives = 0;
        elements.forEach(function(element, i){
            if(element.class !== classifications[i]){
                if(element.class===1){
                    falseNegatives++;
                } else {
                    falsePositives++;
                }
            } else {
                if(element.class===1){
                    truePositives++;
                } else {
                    trueNegatives++;
                }
            }
        });
        
        var precision = truePositives/(truePositives+falsePositives);
        var recall = truePositives/(truePositives+falseNegatives);
        var f1 = precision*recall/(precision+recall);
        
        var domSeparatorDisplay = document.getElementById('separatorDisplay');
        domSeparatorDisplay.innerHTML = 'w(x) = '+(w.y / w.x)+' x '+( (w.bias>=0)?'+ ':' ' )+w.bias;
        
        var domDataRow = document.getElementById('statisticsDataRow');
        domDataRow.innerHTML = '';
        domDataRow.innerHTML += '<td>'+truePositives+'</td>';
        domDataRow.innerHTML += '<td>'+falsePositives+'</td>';
        domDataRow.innerHTML += '<td>'+trueNegatives+'</td>';
        domDataRow.innerHTML += '<td>'+falseNegatives+'</td>';
        domDataRow.innerHTML += '<td>'+(isNaN(precision)?'-':precision.toFixed(2))+'</td>';
        domDataRow.innerHTML += '<td>'+recall.toFixed(2)+'</td>';
        domDataRow.innerHTML += '<td>'+(isNaN(f1)?'-':f1.toFixed(2))+'</td>';
    }
        
    function pushToBuffer(w){
        wBuffer.push( JSON.parse(JSON.stringify(w)) );
        if(wBuffer.length > PARAMS.TRAIL_BUFFER){
            wBuffer.shift();
        }
    }
    
    function step(){
        w = perceptron.adjustClassifier(elements, classifications, w);
        pushToBuffer(w);
        classifications = perceptron.getClassification(elements, w);
        
        var correctCount = perceptron.countCorrectlyClassified(elements, classifications);
        if(correctCount === elements.length){
            if(runInterval != null){
                toggleRun();
            }
        }
        updateStatistics(elements, classifications, w);
        
        redrawClassification();
    }
    
    var runInterval;
    function toggleRun(){
        if(runInterval == null){
            runInterval = setInterval(function(){
                step();
            },PARAMS.RUN_DELAY);
            document.getElementById('runButton').innerHTML = 'stop';
        } else {
            clearInterval(runInterval);
            runInterval = null;
            document.getElementById('runButton').innerHTML = 'run';
        }
    }
    
    function generateElements(){        
        var cloudA = generateRandomCloudAroundCenter(PARAMS.CLOUD.CENTER_A);
        cloudA.map(function(element){
            element.weight = 1;
            element.class = 1;
            return element;
        });

        var cloudB = generateRandomCloudAroundCenter(PARAMS.CLOUD.CENTER_B);
        cloudB.map(function(element){
            element.weight = 1;
            element.class = 0;
            return element;
        });
        
        return cloudA.concat(cloudB);
    }
    
    function setupDrawingContext(){
        var canvas = document.getElementById('mainDisplay');
        canvas.width = PARAMS.CANVAS.WIDTH;
        canvas.height = PARAMS.CANVAS.HEIGHT;
        context = canvas.getContext('2d');
    }
    
    function setupEventListeners(){
        document.getElementById('resetButton').addEventListener('click',init);
        document.getElementById('stepButton').addEventListener('click',step);
        document.getElementById('runButton').addEventListener('click',toggleRun); 
    }
    
    var init = function(){
        updateParams();
        setupEventListeners();    
        setupDrawingContext();

        classifications = [];
        w = {
            x: 0,
            y: 0,
            bias: 0        
        };
        wBuffer = [];
        elements = generateElements();
        
        redrawClassification();
    };
    
    domReady(init);
});