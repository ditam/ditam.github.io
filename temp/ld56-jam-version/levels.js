
function showFadingTitle(config, container, callback) {
  const FADE_IN_DURATION = 2000;
  const ERASE_DURATION = 3000; // should be the same as CSS transition duration on eraser, but in ms
  const wrap = $('<div>').addClass('title-wrapper').appendTo(container);
  const title = $('<div>').addClass('title header').text(config.titleText).appendTo(wrap);

  if (config.subtitleText) {
    title.addClass('with-subtitle');
    const subtitle = $('<div>').addClass('subtitle text').text(config.subtitleText).appendTo(wrap);
  }

  const eraser = $('<div>').addClass('eraser');

  function startDelayedEraser() {
    eraser.appendTo(wrap);
    setTimeout(function() {
      eraser.addClass('on');
      // after the transition of eraser, we fade out and call back
      setTimeout(callback, ERASE_DURATION);
    }, 2000);
  }

  if (config.skipFadeIn) {
    wrap.addClass('black');
    startDelayedEraser();
  } else {
    setTimeout(function() {
      wrap.addClass('black');
      // we need to delay creating the eraser until the fade-to-black is completed, otherwise it will show up as a block
      setTimeout(startDelayedEraser, FADE_IN_DURATION);
    }, 2000);
  }
}

function showNarrativePage(container, msgs, callback) {
  const keywords = ['lichens', 'bacteria', 'insects', 'rodents', 'humans']; // careful here, see html hacking below
  const wrap = $('<div>').addClass('narrative-wrapper').appendTo(container);
  msgs.forEach(msg => {
    let htmlMsg = msg;
    keywords.forEach(word => {
      if (htmlMsg.includes(word)) {
        htmlMsg = htmlMsg.replace(word, `<span>${word}</span>`);
      }
    })
    $('<div>').addClass('text').html(htmlMsg).appendTo(wrap);
  });
  $('<div>').addClass('text spaced').text('Click to continue.').appendTo(wrap);

  wrap.on('click', function() {
    wrap.remove();
    callback();
  });
}

function showTask(container, taskMsg) {
  $('<div>').addClass('task-msg text').text('Task: '+taskMsg).appendTo(container);
}

function hideTaskMsg() {
  $('.task-msg').remove();
}

function setBG(n) {
  const bgs = [
    'bg.png',
    'bg2.png',
    'bg3.png',
    'bg4.png',
  ];
  $('#main').css('background-image', `url(${bgs[n]})`);
}

function intro(config, container, callback) {
  showFadingTitle({titleText: 'Succession'}, container, callback);
}

function level_paintFill(config, container, callback) {
  showFadingTitle(
    {
      titleText: 'Chapter One',
      subtitleText: 'Lichens',
      skipFadeIn: true,
    },
    container,
    function() {
      // this is the first actual task - no setBG yet
      $('.title-wrapper').remove();
      console.log('moving to narrative page');
      showNarrativePage(container, config.narrativeMsgs, function() {
        console.log('moving to impl.');
        paintFill_core(config, container, callback);
      });
    }
  );
}

function paintFill_core(config, container, callback) {
  showTask(container, config.task);
  const WIDTH = 800;
  const HEIGHT = 500;
  let mousePressed = false;
  let paintCount = 0;
  const maxPaintCount = 40;

  const timerWrap = $('<div>').addClass('timer-wrapper');
  const timerLabel = $('<div>').addClass('label').text('Spores left');
  timerLabel.appendTo(timerWrap);
  const timerBar = $('<div>').addClass('bar');
  const timerValue = $('<div>').addClass('value');
  timerValue.appendTo(timerBar);

  timerBar.appendTo(timerWrap);

  timerWrap.appendTo(container); // append before canvas to not mess with mouseover

  // set up canvas
  const canvas = $('<canvas>').attr('width', WIDTH).attr('height', HEIGHT);
  canvas.css('border', '1px solid red');
  canvas.css('opacity', '0.33');
  canvas.appendTo(container);

  const ctx = canvas[0].getContext('2d');
  ctx.fillStyle = 'green';

  // set up UI updates

  function update() {
    if (mousePressed) {
      // register paint count -- note that we don't increase the counter on mousemove,
      // because the frequency of those events is highly platform-specific
      paintCount++;
      if (paintCount > maxPaintCount) {
        timerValue.css('width', 0);
        evaluate();
      } else {
        const pct = (maxPaintCount-paintCount)/maxPaintCount * 100;
        timerValue.css('width', pct + '%');
      }
    }
  }

  let updateInterval = setInterval(update, 100);

  let attempts = 0;
  function evaluate() {
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const data = imageData.data;
    let c1 = 0;
    let c2 = 0;
    for (let i = 0; i < data.length; i += 4) {
      const col = i%(WIDTH*4) / 4;
      if (col < 300) { // clear first n cols
        // NB: we don't write it back to the canvas, just clearing it for the counting below
        data[i + 3] = 0;
      }

      if (data[i + 3]) { // counting alpha channel
        c1++;
      } else {
        c2++;
      }
    }
    const result = c1 / (c1+c2);
    console.log('colored ratio:', result);
    const threshold = 0.4; // NB: the cleared cols change the available area!
    if (result >= threshold) {
      clearInterval(updateInterval);
      successSound.play();
      hideTaskMsg();
      callback({
        result: result,
        attempts: attempts
      });
    } else {
      errorSound.play();
      attempts++;
      mousePressed = false; //otherwise you can just hold and keep failing
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      timerValue.css('width', '100%');
      paintCount = 0;
    }
  }

  // set up interaction
  canvas.on('mousedown', (event) => {
    mousePressed = true;
  });
  canvas.on('mousemove', (event) => {
    if (mousePressed) {
      ctx.beginPath();
      ctx.arc(event.clientX, event.clientY, 30, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  canvas.on('mouseup', (event) => {
    mousePressed = false;
  });
}

function level_bacteria(config, container, callback) {
  showFadingTitle(
    {
      // TODO: move to config
      titleText: 'Chapter Two',
      subtitleText: 'Bacteria',
    },
    container,
    function() {
      setBG(1);
      $('.title-wrapper').remove();
      console.log('moving to narrative page');
      showNarrativePage(container, config.narrativeMsgs, function() {
        console.log('moving to impl.');
        const startTime = new Date().getTime();
        showTask(container, config.task);

        const targetsData = [
          {x: 200, y:  80},
          {x: 510, y: 110},
          {x: 620, y: 150},
          {x: 520, y: 220},
          {x:  60, y: 330},
        ];

        const targetEls = [];

        targetsData.forEach(t => {
          const target = $('<div>').addClass('target-marker');
          targetEls.push(target);
          target.css('left', t.x + 'px');
          target.css('top' , t.y + 'px');
          container.append(target);
          target.data('clicked', false);
          target.on('click', () => {
            target.data('clicked', true);
            target.addClass('clicked');
            checkComplete();
          });
        });

        function checkComplete() {
          if (targetEls.every(t=>t.data('clicked'))) {
            const endTime = new Date().getTime();
            hideTaskMsg();
            successSound.play();
            callback({duration: endTime-startTime});
          }
        }
      });
    }
  );
}

function level_insects(config, container, callback) {
  showFadingTitle(
    {
      // TODO: move to config
      titleText: 'Chapter Three',
      subtitleText: 'Insects',
    },
    container,
    function() {
      setBG(2);
      $('.title-wrapper').remove();
      console.log('moving to narrative page');
      showNarrativePage(container, config.narrativeMsgs, function() {
        console.log('moving to impl.');
        const startTime = new Date().getTime();
        showTask(container, config.task);

        const targetsData = [
          {x:  30, y:  50},
          {x: 570, y:  80},
          {x: 620, y: 120},
          {x: 300, y: 220},
          {x: 310, y: 350},
          {x:  60, y: 400},
          {x: 290, y: 410},
          {x: 600, y: 430},
        ];

        const targetEls = [];

        targetsData.forEach(t => {
          const target = $('<div>').addClass('target-marker small');
          targetEls.push(target);
          target.css('left', t.x + 'px');
          target.css('top' , t.y + 'px');
          container.append(target);
          target.data('clicked', false);
          target.on('click', () => {
            target.data('clicked', true);
            target.addClass('clicked');
            checkComplete();
          });
        });

        function isComplete() {
          return targetEls.every(t=>t.data('clicked'));
        }

        function checkComplete() {
          if (isComplete()) {
            const endTime = new Date().getTime();
            hideTaskMsg();
            successSound.play();
            callback({duration: endTime-startTime, attempts: attempts});
            clearInterval(expireTimeout);
          }
        }

        // FIXME: display timer
        let attempts = 0;
        let expireTimeout = setInterval(function() {
          // if this timeout is reached without checkComplete clearing it, we lose and reset
          attempts++;
          errorSound.play();
          targetEls.forEach(t => {
            t.data('clicked', false);
            t.removeClass('clicked');
          });
        }, 15 * 1000);
      });
    }
  );
}

function level_humans(config, container, callback) {
  showFadingTitle(
    {
      // TODO: move to config
      titleText: 'Epilogue',
      subtitleText: 'Humans',
    },
    container,
    function() {
      setBG(3);
      $('.title-wrapper').remove();
      console.log('moving to narrative page');
      showNarrativePage(container, config.narrativeMsgs, function() {
        console.log('moving to impl.');
        const startTime = new Date().getTime();
        showTask(container, config.task);

        const targetsData = [
          {x: 200, y:  80},
          {x: 510, y: 110},
          {x: 620, y: 150},
          {x: 520, y: 220},
          {x:  60, y: 330},
          {x:  30, y:  50},
          {x: 570, y:  80},
          {x: 620, y: 120},
          {x: 300, y: 220},
          {x: 310, y: 350},
          {x:  60, y: 400},
          {x: 290, y: 410},
          {x: 600, y: 430},
        ];

        const targetEls = [];

        targetsData.forEach(t => {
          // FIXME: alternate wood and animal types
          const target = $('<div>').addClass('target-marker');
          targetEls.push(target);
          target.css('left', t.x + 'px');
          target.css('top' , t.y + 'px');
          container.append(target);
          target.data('clicked', false);
          target.on('click', () => {
            target.data('clicked', true);
            target.addClass('clicked');
            checkComplete();
          });
        });

        function checkComplete() {
          if (targetEls.every(t=>t.data('clicked'))) {
            const endTime = new Date().getTime();
            hideTaskMsg();
            successSound.play();
            callback({duration: endTime-startTime});
          }
        }
      });
    }
  );
}


let currentLevel = 0;
const levels = [
{
  name: 'intro',
  config: {},
  controller: intro
},
{
  name: 'Lichens - area painting',
  config: {
    task: 'Cover 50% of the sunny areas with lichen spores.',
    narrativeMsgs: [
      'A sun-blocking catastrophe can make large swathes of land uninhabitable to most aspects of life.',
      'Fertile soil itself might become a scarce resource as ' +
      'decomposition rates of organic matter plummet due to decreased precipitation and temperature.',
      'The first species capable of colonizing a barren area are often lichens, as they can grow in the driest conditions, ' +
      'sustaining themselves with photosynthesis.'
    ],
  },
  controller: level_paintFill
},
{
  name: 'Bacteria - untimed target clicking',
  config: {
    task: 'Establish bacterial colonies around organic matter.',
    narrativeMsgs: [
      'As lichens accumulate over the barren surface, a layer of soil forms out of their organic material.',
      'Microrganisms such as bacteria, protozoa and nematodes further break down the soil organic matter.',
      'These processes encourage the nitrogen cycle, generating yet more soil and ultimately an environment ' +
      'more capable of sustaining complex plant life.'
    ],
  },
  controller: level_bacteria
},
{
  name: 'Insects - timed clicking',
  config: {
    task: 'Pollinate all flowering plants before the season ends.',
    narrativeMsgs: [
      'As the atmosphere clears and the soil grows, various herbaceous plants take root: ferns, grasses and other flowering plants.',
      'The community can now sustain plant-eating animals as well as insects that act as pollinators.',
      'Man-made structures decay and crumble just like the once barren rock.'
    ],
  },
  controller: level_insects
},
{
  name: 'Humans - untimed clicking',
  config: {
    task: 'Hunt wildlife and chop down trees.',
    narrativeMsgs: [
      'Once the community can sustain mammals, humans emerge from their bunkers and other life-suspending contraptions, ' +
      'much like resilient trees from the earth\'s seed banks, or cocroaches from their nests.',
      'An apex predator, likely to consume more than it needs, set loose upon the land once again.'
    ],
  },
  controller: level_humans
}
];

levels.forEach((o,i) => {
  console.assert(o.name, 'No name for level', i);
  console.assert(o.config, 'No config for level', i);
  console.assert(o.controller, 'No controller for level', i);
});
