"use strict";

$('#warning').hide();
var TIMEOUT = 60 * 1000;
var rowWorker;

// TODO: onchange of maxRepeat, bound to 1-numCount

$('button#generate').click(function() {
  $(this).attr('disabled', true);
  var numCount = $('input#numCount').val();
  var maxRepeat = $('input#maxRepeat').val();
  var rowCount = $('input#rowCount').val();

  $('textarea').html('')
  
  var rows = [];
  rowWorker = new Worker('worker.js');
  
  rowWorker.postMessage([numCount, maxRepeat, rows]);
  var timeout = setTimeout(function() {
    $('#warning').slideDown();    
  }, TIMEOUT);
  
  rowWorker.onmessage = function(e) {
    clearTimeout(timeout);
    var newRow = e.data;
    rows.push(newRow);
    $('textarea').html($('textarea').html()+newRow+'\n');
    
    if (rows.length < rowCount) {
      $('#warning').slideUp();
      rowWorker.postMessage([numCount, maxRepeat, rows]);
      timeout = setTimeout(function() {
        $('#warning').slideDown();    
      }, TIMEOUT);
    } else {
      rowWorker.terminate();
      $('button#generate').attr('disabled', false);
    }
  };
});

$('button#terminate').click(function() {
  rowWorker.terminate();
  $('button#generate').attr('disabled', false);
  $('#warning').slideUp();
});

$('button#download').click(function() {
  var numCount = $('input#numCount').val();
  var maxRepeat = $('input#maxRepeat').val();
  var rowCount = $('input#rowCount').val();
  
  // via https://stackoverflow.com/a/19332584
  var textToWrite = $('textarea').html();
  var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
  var fileNameToSaveAs = 'Keno_' + numCount + 'szam_' + maxRepeat + 'ismetles_' + rowCount + '_szelveny.csv';

  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";

  downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
  downloadLink.onclick = $(downloadLink).remove();
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);

  downloadLink.click();
});
