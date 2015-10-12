define(function () {
    'use strict';
    var seed = 1;
    
    function setSeed(_seed){
        seed = _seed;
    }
    
    /* Returns a deterministic pseudorandom number between 0 and range-1.
       Range defaults to 1000 if not specified.
       Not uniform, not secure. */
    function getRandomInt(_range) {
        var range = _range || 1000;
        var number = Math.abs(Math.sin(seed))*range*1000;
        seed++;
        return Math.round(number)%range;
    }
    
    return {
        setSeed: setSeed,
        getRandomInt: getRandomInt
    };
});