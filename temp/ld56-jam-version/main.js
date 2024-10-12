
let container;

function showFinalScore() {
  console.log('RESULTS:', results);
  // FIXME - add proper counting
  const area = results[1].result;
  const s1 = Math.max(30000-results[2].duration, 0);
  const s2 = Math.max(20000-results[3].duration, 0);
  const s3 = Math.max(25000-results[4].duration, 0);
  const score = Math.round((s1+s2+s3) * area);
  const d1 = $('<div>').addClass('end-msg').text('The end.');
  const d2 = $('<div>').addClass('end-score').text(`You scored ${score} points.`);
  d1.appendTo(container);
  d2.appendTo(container);
}

const results = [];
function startNextLevel() {

  const level = levels[currentLevel];
  console.log(`-starting, level ${currentLevel+1}/${levels.length}`);
  console.log('level ref:', level);

  level.controller(level.config, container, function(res) {
    console.log('level done, result:', res);
    results.push(res);
    container.empty();
    if (currentLevel >= levels.length -1) {
      showFinalScore();
    } else {
      currentLevel++;
      startNextLevel();
    }
  });
}

let songs, sounds;
let errorSound, successSound;

$(document).ready(function() {
  container = $('#main');

  songs = [
    new Audio('bgmusic.mp3'),
  ];

  errorSound = new Audio('error.mp3');
  successSound = new Audio('success.mp3');

  sounds = [
    errorSound,
    successSound,
  ];

  let audioLoadCount = 0;
  $('#loadCountTotal').text(songs.length + sounds.length);
  function countWhenLoaded(audioElement) {
    audioElement.addEventListener('canplaythrough', function() {
      audioLoadCount++;
      $('#loadCount').text(audioLoadCount);
    }, false);
  }

  $('#splash').on('click', function() {
    $('#splash').remove();
    songs[0].play();
    songs[0].addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);

    currentLevel = 0;
    startNextLevel();
  });

  songs.forEach(countWhenLoaded);
  sounds.forEach(countWhenLoaded);
});
