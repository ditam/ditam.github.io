
import constants from './constants.js';
import maputils from './mapdata.js';
import narration from './narration.js';
import utils from './utils.js';

let ctx;

const maxOffsetX = constants.MAP_WIDTH - constants.VIEWPORT_WIDTH;
const maxOffsetY = constants.MAP_HEIGHT - constants.VIEWPORT_HEIGHT;

const player = {
  x: 0,
  y: 0,
  money: 0,
  speed: constants.INITIAL_SPEED,
  range: constants.INITIAL_RANGE
};

// TODO: collect at beginning
let playerName = 'Test Name';

const nowhere = {
  x: 600,
  y: 1400
};

console.assert(constants.INITIAL_RANGE < constants.PLANETARY_ZONE_SIZE, 'Suspicious initial ranges, player >= planetary');

window.isDebug = location && location.hostname==='localhost';

if (window.isDebug) {
  console.log('=== loaded in debug mode ===');
  window.player = player;
}

const viewport = {
  // x and y are offsets from (0, 0)
  x: 0,
  y: 0,
};

function resetProgress(position) {
  player.x = 2039;
  player.y = 1459; // manually matched to intro pos, you do the math

  player.money = 0;
  delete player.target;
  viewport.x = 1080;
  viewport.y = 920;

  if (position) {
    player.x = position.x;
    player.y = position.y;
    viewport.x = 110; // FIXME: calculate from positionOverride
    viewport.y = 550;
  }

  if (isDebug) {
    player.money = 120000;
  }
}
resetProgress();

// img assets
const imgAssets = {
  dodoImg: $('<img>').attr('src', 'img/the-dodo.png').get(0),
  shipImg: $('<img>').attr('src', 'img/ship.png').get(0),
  planetImg0: $('<img>').attr('src', 'img/planet-0.png').get(0),
  planetImg1: $('<img>').attr('src', 'img/planet-1.png').get(0),
  planetImg2: $('<img>').attr('src', 'img/planet-2.png').get(0),
  planetImg3: $('<img>').attr('src', 'img/planet-3.png').get(0),
  planetImg4: $('<img>').attr('src', 'img/planet-4.png').get(0)
};

// sanity checks for initial setup
console.assert(player.x < constants.MAP_WIDTH, 'Invalid player x0');
console.assert(player.y < constants.MAP_HEIGHT, 'Invalid player y0');
console.assert(viewport.x + constants.VIEWPORT_WIDTH <= constants.MAP_WIDTH, 'Invalid viewport x0 ' + viewport.x);
console.assert(viewport.y + constants.VIEWPORT_HEIGHT <= constants.MAP_HEIGHT, 'Invalid viewport y0 ' + viewport.y);

let mapObjects = [];
maputils.loadMapData(mapObjects, imgAssets);
if (window.isDebug) {
  window.mapObjects = mapObjects;
  window.showVictoryScreen = showVictoryScreen;
}

function getObject(id) {
  const filtered = mapObjects.filter(o=>o.id==id);
  console.assert(filtered.length > 0, 'No object found for ID: ' + id);
  console.assert(filtered.length < 2, 'Multiple objects found with ID: '+ id);
  return filtered[0];
}

const bgStars = [];
let startfieldInitialized = false;
(function generateStarfield() {
  console.assert(!startfieldInitialized, 'starfield already initialized');
  startfieldInitialized = true;
  for (let i=0; i<1400; i++) {
    const b = utils.getRandomInt(0, 185); // brightness
    const dR = utils.getRandomInt(0, 70);
    const dG = utils.getRandomInt(0, 70);
    const dB = utils.getRandomInt(0, 70);
    bgStars.push({
      x: utils.getRandomInt(0, constants.MAP_WIDTH),
      y: utils.getRandomInt(0, constants.MAP_HEIGHT),
      size: Math.random() < 0.3 ? utils.getRandomInt(1, 3) : 1,
      color: `rgb(${b+dR}, ${b+dG}, ${b+dB})`
    });
  }
})();

function scrollViewPort() {
  if (mouse.x < constants.SCROLL_AREA_WIDTH) {
    viewport.x = Math.max(0, viewport.x - constants.SCROLL_STEP_SIZE);
  }
  if (mouse.x > constants.VIEWPORT_WIDTH - constants.SCROLL_AREA_WIDTH) {
    viewport.x = Math.min(maxOffsetX, viewport.x + constants.SCROLL_STEP_SIZE);
  }
  if (mouse.y < constants.SCROLL_AREA_WIDTH) {
    viewport.y = Math.max(0, viewport.y - constants.SCROLL_STEP_SIZE);
  }
  if (mouse.y > constants.VIEWPORT_HEIGHT - constants.SCROLL_AREA_WIDTH) {
    viewport.y = Math.min(maxOffsetY, viewport.y + constants.SCROLL_STEP_SIZE);
  }
}

let debugLog, debugLog2, debugLog3;
let frameCount = 0;
const mouse = {
  // NB: Values inside viewport!
  // (init with non-0 so that scroll is not triggered)
  x: constants.VIEWPORT_WIDTH / 2,
  y: constants.VIEWPORT_HEIGHT / 2
};

function applyMovements(timestamp) {
  // player movement
  if (player.target) {
    // move player towards target
    let t = player.target;
    const dist = utils.dist(player, t);

    if (dist < player.speed * 3) {
      // snap to target to avoid wiggling
      // (allowing for bigger overshoot with bigger speeds)
      player.x = t.x;
      player.y = t.y;
      delete player.target;
    } else {
      // move towards target
      const vector = utils.getTargetVector(player, t);
      player.x += vector.dX * player.speed;
      player.y += vector.dY * player.speed;
    }

    if (utils.dist(nowhere, player) < 200) {
      narration.show('nowhere');
      broadcastSound.play();
    }
  }

  // moon movement
  mapObjects.filter(o=>o.type === 'moon').forEach(m => {
    const time = timestamp/(75 * 1000); // total orbit duration
    const moonDX = Math.sin(time%2*Math.PI) * constants.MOON_ORBIT_SIZE;
    const moonDY = Math.cos(time%2*Math.PI) * constants.MOON_ORBIT_SIZE;
    const planet = getObject(m.orbits);
    m.x = planet.x + moonDX;
    m.y = planet.y + moonDY;
  });

  // other ships movement
  mapObjects.filter(o=>o.type === 'patrol' || o.type === 'ship').forEach(o => {
    if (o.type === 'patrol') {
      // patrols move towards player
      const vector = utils.getTargetVector(o, player);
      o.x += vector.dX * constants.PATROL_SPEED;
      o.y += vector.dY * constants.PATROL_SPEED;

      if (utils.dist(o, player) < constants.PATROL_INTERCEPT_RANGE) {
        const planetID = o.id.split('patrol-').join('');
        let positionOverride;
        if (planetID === 'Dagon') {
          // nicer for the players
          positionOverride = {
            x: 1100,
            y: 1100
          };
        }
        resetProgress(positionOverride);
        narration.show('patrol-intercept', planetID);
        broadcastSound.play();
      }
    } else {
      // other ships move towards targets
      if (o.targetID) {
        const target = getObject(o.targetID);
        const vector = utils.getTargetVector(o, target);
        o.x += vector.dX * constants.CARGO_SPEED;
        o.y += vector.dY * constants.CARGO_SPEED;
        // turn back if reached
        if (utils.dist(o, target) < constants.CARGO_SPEED * 3) {
          const tmp = o.targetID;
          o.targetID = o.sourceID;
          o.sourceID = tmp;
        }
      }
    }
  });
}

let paused = true; // unlocked during intro
function drawFrame(timestamp) {
  if (paused) {
    requestAnimationFrame(drawFrame);
    return;
  }
  const t0 = performance.now();
  frameCount++;

  // log debug stuff to DOM
  if (window.isDebug) {
    debugLog.text(JSON.stringify(player) + ', ' + JSON.stringify(viewport));
  }

  // adjust viewport if necessary
  scrollViewPort();

  // clear canvas
  ctx.clearRect(0, 0, constants.VIEWPORT_WIDTH, constants.VIEWPORT_HEIGHT);

  // gridlines
  if (isDebug) {
    utils.drawDebugGrid(ctx, viewport);
  }

  // bg stars // TODO: could be static for a given viewport
  ctx.save();
  bgStars.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x - viewport.x, o.y - viewport.y, o.size, o.size);
  });
  ctx.restore();

  // apply player and ship movements
  applyMovements(timestamp);

  // map objects
  ctx.save();
  mapObjects.forEach(o => {
    const size = o.type === 'planet'? constants.PLANET_SIZE : 24;
    const type2Color = {
      planet: 'gray',
      moon: 'gray',
      ship: 'gray',
      patrol: 'blue'
    };
    ctx.fillStyle = type2Color[o.type];

    if (o.type === 'planet') {
      ctx.drawImage(o.img, o.x - viewport.x - size/2, o.y - viewport.y - size/2, size, size);
    } else if (o.type === 'moon') {
      ctx.beginPath();
      ctx.arc(o.x - viewport.x, o.y - viewport.y, size, 0, Math.PI*2);
      ctx.fill();
    } else if (o.type === 'ship') {
      ctx.save();
        // TODO: extract rotation into util or shared between ships and player
        ctx.translate(o.x-viewport.x, o.y-viewport.y);
        const vector = utils.getTargetVector(o, getObject(o.targetID));
        let angle = Math.atan(vector.dY/vector.dX) + Math.PI/2;
        if (vector.dX < 0) {
          angle -= Math.PI;
        }
        ctx.rotate(angle);
        ctx.translate(-(o.x-viewport.x), -(o.y-viewport.y));
        ctx.drawImage(imgAssets.shipImg, o.x - viewport.x - size/2, o.y - viewport.y - size/2, size, size);
      ctx.restore();
    } else {
      ctx.fillRect(o.x - viewport.x - size/2, o.y - viewport.y - size/2, size, size);
    }

    // relay marker (can be moon or ship)
    if (o.hasRelay) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      // we want moon relays to reach their planets
      const relay_range = o.type === 'moon'? constants.MOON_ORBIT_SIZE + 32 : constants.RELAY_RANGE;
      ctx.arc(o.x - viewport.x, o.y - viewport.y, relay_range, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    // planetary zone marker
    if (o.type === 'planet') {
      ctx.save();
      ctx.strokeStyle = 'rgba(224, 100, 100, 0.6)';
      ctx.beginPath();
      ctx.setLineDash([15, 5]);
      ctx.arc(o.x - viewport.x, o.y - viewport.y, constants.PLANETARY_ZONE_SIZE, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();

  // draw target marker
  if (player.target) {  // NB: separate check, target might have been removed above
    ctx.save();
    ctx.strokeStyle = 'rgba(114, 218, 168, 0.68)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.setLineDash([5, 15]);
    // draw from target, other direction looks like it's being pushed into a hole
    ctx.moveTo(player.target.x - viewport.x, player.target.y - viewport.y);
    ctx.lineTo(player.x - viewport.x, player.y - viewport.y);
    ctx.stroke();
    ctx.restore();
  }

  // draw player
  ctx.save();
  ctx.beginPath();
  const size = constants.PLAYER_SIZE;
  ctx.save();
    ctx.translate(player.x-viewport.x, player.y-viewport.y);
    let vector;
    if (player.target) {
      vector = utils.getTargetVector(player, player.target);
    } else {
      vector = utils.getTargetVector(player, {x: player.x, y: player.y-100});
    }
    let angle = Math.atan(vector.dY/vector.dX) + Math.PI/2;
    if (vector.dX < 0) {
      angle -= Math.PI;
    }
    ctx.rotate(angle);
    ctx.translate(-(player.x-viewport.x), -(player.y-viewport.y));
    ctx.drawImage(imgAssets.dodoImg, player.x - viewport.x - size/2, player.y - viewport.y - size/2, size, size);
    if (window.isDebug) {
      ctx.fillStyle = 'red';
      ctx.fillRect(player.x - viewport.x, player.y - viewport.y, 4, 4);
    }
  ctx.restore();
  ctx.fill();
  ctx.restore();

  // draw range indicator
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.arc(player.x - viewport.x, player.y - viewport.y, player.range, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();

  // update UI if needed
  updateHeader();
  updateObjectsInRange();

  // perf check
  const t1 = performance.now();
  debugLog3.text((t1-t0).toFixed(1) + ' ms per frame');

  // queue next frame
  requestAnimationFrame(drawFrame);
}

let idsInRange_old = [];
function updateObjectsInRange() {
  // keeps track of objects in range, dispatches patrols, updates commsList in DOM
  const objectsInRange = mapObjects.filter(o => {
    return utils.dist(player, o) <= player.range;
  });
  const objectsNotInRange = mapObjects.filter(o => {
    return utils.dist(player, o) > player.range;
  });

  const idsInRange = objectsInRange.map(o => o.id).sort();

  if (!utils.arraysEqual(idsInRange_old, idsInRange)) { // list has changed
    //console.log('-- new comms list:', objectsInRange);
    // update planetary patrols
    objectsInRange.filter(o=>o.type==='planet').forEach(p=>{
      if (!p.bribed && !p.hasPatrol) {
        const patrol = {
          type: 'patrol',
          id: 'patrol-'+p.id,
          name: utils.getRandomName(),
          x: p.x,
          y: p.y,
          population: 2
        };
        mapObjects.push(patrol);
        objectsInRange.push(patrol);
        p.hasPatrol = true;
        alarmSound.play();
      }
    });
    objectsNotInRange.filter(o=>o.type==='planet').forEach(p=>{
      if (p.hasPatrol) {
        const patrol = getObject('patrol-'+p.id);
        utils.removeItem(mapObjects, patrol);
        p.hasPatrol = false;
      }
    });

    commsList.empty();
    objectsInRange.filter(o=>o.type === 'patrol' || o.type === 'ship' || o.type === 'moon').forEach(o => {
      const entry = $('<div>');
      entry.addClass('comms-entry');
      entry.text(o.name);
      entry.appendTo(commsList);
      entry.on('click', ()=> {
        commsList.hide();
        narration.clearCurrent();
        showCommDialog(o);
      });
    });
  }

  idsInRange_old = idsInRange;
}

function showCommDialog(o) {
  console.assert(o.x, o.y, 'Invalid comms target:', o);
  paused = true;
  if (o.type === 'ship') {
    console.assert(o.name, o.targetID, o.sourceID, 'Invalid ship in comms:', o);
    commsDialog.find('#comms-title').text('Message from: ' + o.name);
    commsDialog.find('#comms-text').text(
      (Math.random() < 0.5 ? `Good to see you, ${playerName}! ` : 'Hey, are you that radio guy? ') +
      `I'm shipping cargo between ${o.targetID} and ${o.sourceID}. ` +
      'If you want, for a small fee I wouldn\'t mind carrying a small relay for your broadcast.'
    );
    commsDialog.find('#comms-action-button').text('Install relay').on('click', () => {
      if (player.money >= 5000) {
        player.money -= 5000;
        console.log('Adding relay to ship:', o.id, o);
        o.hasRelay = true;
        clickSound.play();
      } else {
        errorSound.play();
      }
      closeCommsDialog();
    });
    commsDialog.find('#comms-action-button-desc').text('Costs 5000');
  } else if (o.type === 'patrol') {
    const planetID = o.id.split('patrol-').join('');
    const planet = getObject(planetID);
    console.assert(o.id, planet, 'Invalid patrol in comms:', o);
    commsDialog.find('#comms-title').text('Message from: Officer ' + o.name.split(' ').pop());
    commsDialog.find('#comms-text').text(
      `You are in breach of the planetary sphere of ${planetID}. ` +
      `Charges are illegal entry and civilian frequency broadcasting without a permit. ` +
      'Please stand by for boarding and inspection.'
    );
    if (planet.banBribes) {
      commsDialog.find('#comms-action-button').hide();
      commsDialog.find('#comms-action-button-desc').hide();
    } else {
      commsDialog.find('#comms-action-button').show();
      commsDialog.find('#comms-action-button-desc').show();
    }
    commsDialog.find('#comms-action-button').text('Bribe').on('click', () => {
      if (player.money >= 40000) {
        player.money -= 40000;
        utils.removeItem(mapObjects, o);
        planet.hasPatrol = false;
        planet.bribed = true;
        clickSound.play();
      } else {
        errorSound.play();
      }
      closeCommsDialog();
    });
    commsDialog.find('#comms-action-button-desc').text('Costs 40 000');
  } else {
    // moon
    console.assert(o.subtype, o.name, 'Invalid moon in comms:', o);
    const readableSubtype = o.subtype === 'basic'? 'small moon': 'space station';
    commsDialog.find('#comms-title').text('Message from: ' + o.name);
    commsDialog.find('#comms-text').text(
      `Hey ${playerName}, this is ${o.name} from the ${readableSubtype} orbiting ${o.orbits}. ` +
      (o.subtype === 'basic'?
        `I like your channel. If you cover the costs, feel free to set up a powerful relay here.` :
        `We can tinker with your Dodo a bit to make it perform better. Heck, we\'ll even rebroadcast your signal.`)
    );
    let buttonByType = {
      'basic': 'Install relay',
      'station-speed': 'Upgrade speed',
      'station-range': 'Upgrade range'
    };
    commsDialog.find('#comms-action-button').text(buttonByType[o.subtype]).on('click', () => {
      if (player.money >= 20000) {
        player.money -= 20000;
        if (o.subtype === 'basic') {
          o.hasRelay = true;
        }
        if (o.subtype === 'station-speed') {
          player.speed += 0.5;
          o.hasRelay = true;
        }
        if (o.subtype === 'station-range') {
          player.range += 20;
          o.hasRelay = true;
        }
        clickSound.play();
      } else {
        errorSound.play();
      }
      closeCommsDialog();
    });
    commsDialog.find('#comms-action-button-desc').text('Costs 20 000');
  }

  commsDialog.find('#comms-close-button').text('Close').on('click', closeCommsDialog);
  commsDialog.show();
}

function closeCommsDialog() {
  // TODO: better click handling for this dialog pls
  commsDialog.find('#comms-action-button').off();
  commsDialog.find('#comms-close-button').off();

  commsDialog.hide();
  commsList.show();
  paused = false;
}

function updateHeader() {
  const totalPopulation = utils.sum(mapObjects.map(o => o.population));
  const coveredPopulation = calculateCoverage();
  const percentage = coveredPopulation / totalPopulation * 100;
  coverageCounter.text(`${coveredPopulation} listeners (${percentage.toFixed(2)}%)`);

  const ratio = coveredPopulation / totalPopulation;
  if (ratio >= 1) {
    showVictoryScreen();
  }

  const earnings = Math.round(ratio * 30); // TODO: constant
  player.money += earnings;
  moneyCounter.text(`${player.money} credits`);
}

function calculateCoverage() {
  const relays = mapObjects.filter(o=>o.hasRelay);
  relays.push(player);

  const objectsInRangeOfAnyRelay = mapObjects.filter(o => {
    return relays.some(r=>{
      let range;
      if (r.type === 'ship') {
        range = constants.RELAY_RANGE;
      } else if (r.type === 'moon') {
        range = constants.MOON_ORBIT_SIZE + 32;
      } else {
        range = player.range
      }
      return utils.dist(r, o) <= range;
    });
  });

  return utils.sum(objectsInRangeOfAnyRelay.map(o => o.population));
}

function showVictoryScreen() {
  $('#victory-screen').css({
    width: constants.VIEWPORT_WIDTH + 'px',
    height: constants.VIEWPORT_HEIGHT + 'px'
  });
  $('#victory-screen').show();
}

let moneyCounter, coverageCounter;
let commsList, commsDialog;
let songs, sounds;
let errorSound, clickSound, casetteSound, broadcastSound, alarmSound;
$(document).ready(function() {
  songs = [
    new Audio('sounds/bgMusic0.mp3'),
    new Audio('sounds/bgMusic1.mp3'),
    new Audio('sounds/bgMusic2.mp3'),
  ];
  sounds = [
    new Audio('sounds/error.mp3'),
    new Audio('sounds/click.ogg'),
    new Audio('sounds/casette.mp3'),
    new Audio('sounds/broadcast-start.mp3'),
    new Audio('sounds/alarm.mp3'),
  ];

  errorSound = sounds[0];
  clickSound = sounds[1];
  casetteSound = sounds[2];
  broadcastSound = sounds[3];
  alarmSound = sounds[4];

  const cover = $('#cover-image');
  cover.css({
    width: constants.VIEWPORT_WIDTH + 'px',
    height: constants.VIEWPORT_HEIGHT + 'px'
  });
  cover.find('#start-button').click(function() {
    playerName = $('#name-input').val() || 'Guy';
    narration.show('start-game', playerName);
    cover.remove();

    songs.forEach(function(song, i) {
      song.addEventListener('ended', function() {
        this.currentTime = 0;
        playNextSong();
      }, false);
    });

    let currentSongIndex = 0;
    function playNextSong() {
      currentSongIndex = (currentSongIndex + 1) % songs.length;
      console.log('---switched to bgMusic index:', currentSongIndex);
      songs[currentSongIndex].play();
    }

    // Timed intro sequence
    casetteSound.play();
    setTimeout(() => {
      broadcastSound.play();
    }, 1.5 * 1000);
    setTimeout(() => {
      broadcastSound.play();
    }, 3 * 1000);
    setTimeout(() => {
      broadcastSound.currentTime = 0;
      broadcastSound.play();
    }, 4 * 1000);
    setTimeout(() => {
      $('#intro-cover img').addClass('zoomed-out');
      songs[0].play();
    }, 8 * 1000);
    setTimeout(() => {
      $('#intro-cover').addClass('transparent');
      $('#comms-button').show();
      paused = false;
    }, 12 * 1000); // above + img CSS transition
    setTimeout(() => {
      $('#intro-cover').remove();
    }, 15 * 1000); // above + cover opacity transition
  });

  const introCover = $('#intro-cover');
  introCover.css({
    width: constants.VIEWPORT_WIDTH + 'px',
    height: constants.VIEWPORT_HEIGHT + 'px'
  });

  let audioLoadCount = 0;
  let audioCountTotal = songs.length + sounds.length;
  $('#loadCountTotal').text(audioCountTotal);
  function countWhenLoaded(audioElement) {
    audioElement.addEventListener('canplaythrough', function() {
      audioLoadCount++;
      $('#loadCount').text(audioLoadCount);
      if (audioLoadCount === audioCountTotal) {
        $('#loader').html('Loading completed.');
        if ($('#name-input').val().length > 0) {
          $('#start-button').show();
        }
      }
    }, false);
  }
  songs.forEach(countWhenLoaded);
  sounds.forEach(countWhenLoaded);

  $('#name-input').on('change', ()=> {
    if (audioLoadCount === audioCountTotal) {
      $('#start-button').show();
    }
  });

  const canvas = document.getElementById('main-canvas');

  $(canvas).attr('width', constants.VIEWPORT_WIDTH);
  $(canvas).attr('height', constants.VIEWPORT_HEIGHT);

  const narrationContainer = $('#narration-container');
  narrationContainer.css({
    width: constants.VIEWPORT_WIDTH + 'px',
    height: constants.VIEWPORT_HEIGHT + 'px'
  });
  narration.init(narrationContainer);

  debugLog = $('#debug-log');
  debugLog2 = $('#debug-log2');
  debugLog3 = $('#debug-log3');

  moneyCounter = $('#money-counter');
  coverageCounter = $('#coverage-counter');
  commsList = $('#comms-list');
  $('#comms-button').hide();

  commsDialog = $('#comms-dialog').hide();
  commsDialog.css({
    width: constants.VIEWPORT_WIDTH + 'px',
    height: constants.VIEWPORT_HEIGHT + 'px'
  });

  ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  narrationContainer.get(0).addEventListener('mousemove', event => {
    mouse.x = event.offsetX;
    mouse.y = event.offsetY;

    if (isDebug) {
      debugLog2.text('mouse:' + JSON.stringify(mouse));
    }
  });

  // custom right-click behaviour
  document.addEventListener('contextmenu', function(e) {
    if (e.target === canvas || e.target === narrationContainer.get(0)) {
      // this is to be nice so that you can still use it outside the game canvas
      e.preventDefault();
      const target = {
        x: viewport.x + e.offsetX,
        y: viewport.y + e.offsetY
      };
      if (utils.dist(player, target) > constants.MIN_TARGET_DIST) {
        console.log('set new target:', target);
        player.target = target;
      }
    }
  }, false);

  // center view on space bar
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      viewport.x = utils.clamp(player.x - constants.VIEWPORT_WIDTH / 2, 0, maxOffsetX);
      viewport.y = utils.clamp(player.y - constants.VIEWPORT_HEIGHT / 2, 0, maxOffsetY);
      mouse.x = constants.VIEWPORT_WIDTH / 2;
      mouse.y = constants.VIEWPORT_HEIGHT / 2;
    }
  });

  drawFrame();
});
