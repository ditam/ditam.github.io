"use strict";

var CONSTANTS = Object.freeze({
  KENO_MIN: 1,
  KENO_MAX: 80
});

function arraySorter(a, b) { return a-b; }

function getRandomNum(excludedNumbers) {
  if (!excludedNumbers) {
    excludedNumbers = [];
  }
  var randomInt;
  do {
    randomInt = Math.floor(CONSTANTS.KENO_MIN + Math.random() * Math.floor(CONSTANTS.KENO_MAX));
  } while(excludedNumbers.includes(randomInt));
  return randomInt;
}

function getRandomTicket(length) {
  var ticket = [];
  for (var i=0; i<length; i++) {
    ticket.push(getRandomNum(ticket));
  }
  return ticket.sort(arraySorter);
}

function rowHasTooManyRepeats(row, maxRepeat, rowsSoFar) {
  for(var i=0;i<rowsSoFar.length;i++){
    var existingRow = rowsSoFar[i];
    var repeatCount = 0;
    existingRow.forEach(function(num){
      if (row.includes(num)) {
        repeatCount++;
      }
    });
    if (repeatCount > maxRepeat) {
      return true;
    }
  }
  return false;
}

function generateRow(numCount, maxRepeat, rowsSoFar) {
  var newRow;
  do {
    newRow = getRandomTicket(numCount);
  } while(rowHasTooManyRepeats(newRow, maxRepeat, rowsSoFar));
  return newRow;
}

onmessage = function(e) {
  var params = e.data;
  var row = generateRow(params[0], params[1], params[2]);
  postMessage(row);
}
