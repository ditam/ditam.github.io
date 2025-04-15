const levels = [
  {
    // bgAsset is the image that's revealed after digging on this level
    bgAsset: 'assets/bg-1.png',
  },
  {
    bgAsset: 'assets/bg-2.png',
  },
  {
    bgAsset: 'assets/bg-3.png',
  },
  {
    onLoad: (context) => {
      $('#game-area').addClass('darkened');
      if (context.humSound) {
        context.humSound.volume = 0.3;
        context.humSound.play();
      }
      if (context.workers) {
        context.workers[2].dead = true;
        $('#worker-3').remove();
        context.updateWorkers();
      }
    },
    bgAsset: 'assets/bg-4.png',
  },
  {
    onLoad: (context) => {
      $('#game-area').addClass('darkened');
      if (context.humSound) {
        context.humSound.volume = 0.4;
      }
    },
    bgAsset: 'assets/bg-5.png',
  },
  {
    onLoad: (context) => {
      $('#game-area').removeClass('darkened').addClass('darkened-2');
      if (context.humSound) {
        context.humSound.volume = 0.5;
      }
      if (context.songs) {
        context.songs[0].pause();
        context.songs[1].pause();
        const lastSong = context.songs[2];
        lastSong.play();
        lastSong.addEventListener('ended', function() {
          lastSong.currentTime = 0;
          lastSong.play();
        }, false);
      }
    },
    bgAsset: 'assets/bg-6.png',
  },
];

const storyTexts = [
  (
    'Good day sir. My name is Aken, I represent the Ministry of Culture. I\'ve been assigned to supervise your dig site,' +
    'to make sure that any artifacts of historical significance are handled properly. This area has been known to turn up relics.'
  ),
  (
    'Some of these artifacts are remarkable. They contain ancient glyphs that I\'ve never seen before. I hope to translate some fragments soon.'
  ),
  (
    'These items talk of a ruler of great power. I think we should consider not digging further and handing the site over to our archeologists.'
  ),
  (
    'Sir, one of your workers has died under that collapsed wall! Yet another reason to stop this excavation. Something terrible is happening here.'
  ),
  (
    'These texts... they are not singing the praise of a foregone empire. They are warnings to trespassers! We have to leave.'
  ),
  (
    'I beg of you sir, please stop before it is too late!'
  ),
];
console.assert(levels.length === storyTexts.length);
levels.forEach((l, i) => {
  l.storyText = storyTexts[i];
});

export default levels;