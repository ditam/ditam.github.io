
const WIDTH = 1600; // match to sweep .visible CSS rule or change from class-based to js-based sweep target position
const MAX_WIDTH = 2400;
const HEIGHT = 900;
const MAX_HEIGHT = 1600;
const MAP_SCROLL_PADDING = 300;

const TILE_SIZE = 100;

const PLAYER_SIZE = 56;
const PLAYER_SPEED = 3;
// NB: the current collision detection might leave PLAYER_SPEED-1 sized gaps

const NEARBY_RADIUS = 120;

const SWEEP_DURATION = 2500; // should match CSS until we can add it dynamically
const SWEEP_WIDTH = 150;

let DEBUG = location && location.hostname==='localhost';

let ctx;
let debugLog;
let dayCountArea, timeCountArea, nextPingArea, speedArea, dilationArea;
let pingSweep;
let msgLogArea;

let dayCount = 105; // days in year
let timeCount = 16 * 60 * 60 * 1000 + 187000; // ms in day
let lastPing = timeCount;

let shipSpeed = 0.5; // fraction of c
let shipSpeedLimit = 0.7;

const playerImage = $('<img>').attr('src', 'assets/player.png').get(0);
let playerAngle = 0; // radians, starting from x axis clockwise

const curioImage = $('<img>').attr('src', 'assets/marker.png').get(0);

const player = {
  x: 2100,
  y: 200
};

const viewport = {
  x: 900,
  y: 000
};

// this is just a shortcut, and it's error-prone to have it...
// TODO: get rid of this
const playerInViewport = {
  x: player.x - viewport.x,
  y: player.y - viewport.y
};

const mapTiles = [
                                                               // x -> player start 2100
  [5, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5],
  [5, 2, 3, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 5],
  [5, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 0, 5], // y -> player start 200
  [0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5],
  [1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 3, 3, 3, 0, 0, 0, 5, 5, 5, 5],
  [1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 3, 3, 3, 0, 0, 0, 5, 5, 5, 5],
  [1, 0, 3, 3, 3, 0, 1, 0, 1, 0, 0, 0, 1, 0, 3, 3, 3, 0, 0, 3, 3, 5, 5, 5],
  [1, 0, 3, 3, 3, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 5, 5, 5],
  [1, 0, 3, 3, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 5, 5, 5],
  [1, 0, 0, 3, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 5, 5, 5, 5],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 5, 5, 5, 5],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 5],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 5],
  [3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 3, 3, 3, 0, 5],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3, 3, 3, 5, 5],
];

console.assert(mapTiles[0].length * TILE_SIZE >= MAX_WIDTH, 'Not enough map tile columns to cover MAX_WIDTH');
console.assert(mapTiles.length * TILE_SIZE >= MAX_HEIGHT, 'Not enough map tile rows to cover MAX_HEIGHT');

const tileTypes = [
  { // 0 - blocker
    bgURL: 'assets/tile0.png',
    blocker: true,
  },
  { // 1 - corridor
    bgURL: 'assets/tile1.png',
  },
  { // 2 - warning
    bgURL: 'assets/tile2.png',
  },
  { // 3 - safe
    bgURL: 'assets/tile3.png',
    allowedDuringPing: true
  },
  { // 4 - passable glass
    transparent: true,
  },
  { // 5 - non-passable glass
    transparent: true,
    blocker: true,
  },
];

const mapObjects = [
  {
    type: 'terminal',
    id: 'terminal1',
    readCount: 0,
    x: 2000,
    y: 80,
    assetURL: 'assets/terminal.png',
  },
  {
    type: 'terminal',
    id: 'terminal2',
    readCount: 0,
    x: 1500,
    y: 380,
    assetURL: 'assets/terminal.png',
  },
  {
    type: 'terminal',
    id: 'terminal3',
    readCount: 0,
    x: 400,
    y: 580,
    assetURL: 'assets/terminal.png',
  },
  {
    type: 'custom',
    x: 2000,
    y: 500,
    assetURL: 'assets/cockpit.png',
    w: 200,
    h: 500,
  },
  {
    type: 'speed-control',
    x: 2000,
    y: 700,
    assetURL: 'assets/speed_control.png',
  },
];

const useGridmarks = false;
if (DEBUG && useGridmarks) {
  for (let i=0; i<25; i++) {
    for (let j=0; j<20; j++) {
      mapObjects.push({
        type: 'gridmark',
        x: i*50-2,
        y: j*50-2
      });
    }
  }
}

(function addImageRefToTileTypesAndObjects() {
  tileTypes.forEach(tile => {
    if (tile.transparent) {
      return;
    }
    const image = $('<img>').attr('src', tile.bgURL);
    // FIXME: use dictionary for collecting image elements - no need for duplicates
    tile.image = image.get(0);
  });
  mapObjects.forEach(o => {
    if (o.type === 'gridmark') {
      return;
    }
    console.assert(o.assetURL, 'Malformed map object: ', o);
    const image = $('<img>').attr('src', o.assetURL);
    o.image = image.get(0);
  });
})();

const mapWalls = [
  {
    id: 'first-door',
    floating: true, // floating walls are not on the edge of blocking tiles - only these are considered for movement blocks
                    // (Typically these are manually added walls added, when we want to block a location that would be normally accessible.)
    x: 2000,
    y: 200,
    orientation: 'vertical'
  },
  {
    id: 'cockpit-door',
    floating: true,
    x: 1900,
    y: 700,
    orientation: 'vertical'
  },
];

let floatingWalls = [];
function updateFloatingWalls() {
  floatingWalls = mapWalls.filter(w => w.floating);
}
updateFloatingWalls();

(function addWalls() {
  mapTiles.forEach((row, rowIndex) => {
    row.forEach((t, colIndex) => {
      const tile = tileTypes[t];
      console.assert(typeof tile === 'object', 'Invalid tile type: ' + t + ' -> ' + tile);

      // check tile changes only backwards (from above and left), the other directions are covered by later tiles
      if (rowIndex > 0) {
        const tAbove = mapTiles[rowIndex-1][colIndex];
        const tileAbove = tileTypes[tAbove];
        if (tAbove !== t && (tile.blocker || tileAbove.blocker)) {
          mapWalls.push({
            x: colIndex * TILE_SIZE,
            y: rowIndex * TILE_SIZE,
            orientation: 'horizontal'
          });
        }
      }
      if (colIndex > 0) {
        const tToLeft = mapTiles[rowIndex][colIndex-1];
        const tileToLeft = tileTypes[tToLeft];
        if (tToLeft !== t && (tile.blocker || tileToLeft.blocker)) {
          mapWalls.push({
            x: colIndex * TILE_SIZE,
            y: rowIndex * TILE_SIZE,
            orientation: 'vertical'
          });
        }
      }
    });
  });
})();

const startField = [];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

(function generateStarField() {
  for (let i=0;i<300;i++) {
    startField.push({
      x: Math.floor(Math.random()*WIDTH),
      y: Math.floor(Math.random()*HEIGHT),
      color: getRandomItem(['#605050', '#406080', '#f0e090', '#f5eec0', '#ffffff']),
      size: Math.floor(Math.random()*4) +1,
    });
  }
})();

function getTileCoords(position) {
  console.assert('x' in position && 'y' in position, 'Invalid position: ' + position);
  return {
    x: Math.floor(position.x / TILE_SIZE),
    y: Math.floor(position.y / TILE_SIZE)
  };
}

function canMoveTo(position) {
  // disallows moving to forbidden/blocker tiles and through custom walls
  const tileCoords = getTileCoords(position);

  // it is valid to check out of bounds (to allow for simple player size offsets going right/down),
  // but it is guaranteed to be forbidden
  if (
    tileCoords.x > mapTiles[0].length - 1 ||
    tileCoords.y > mapTiles.length - 1 ||
    tileCoords.x < 0 ||
    tileCoords.y < 0
  ) {
    return false;
  }

  // check for custom floating walls:
  let wallHit = false;
  floatingWalls.forEach(wall => {
    // We're generous with hitboxes, because there might be some bug here...
    const padding = PLAYER_SIZE / 4;

    if (wall.orientation === 'horizontal') {
      const min = Math.min(player.y, position.y);
      const max = Math.max(player.y, position.y);
      // NB: currently we only support tile-wide walls
      const playerAlignedWithWall = wall.x - padding < player.x && player.x < wall.x + TILE_SIZE + padding;
      if (playerAlignedWithWall && min < wall.y && wall.y < max) {
        wallHit = true;
      }
    } else {
      const min = Math.min(player.x, position.x);
      const max = Math.max(player.x, position.x);
      // NB: currently we only support tile-wide walls
      const playerAlignedWithWall = wall.y - padding < player.y && player.y < wall.y + TILE_SIZE + padding;
      if (playerAlignedWithWall && min < wall.x && wall.x < max) {
        wallHit = true;
      }
    }
  });
  if (wallHit) {
    return false;
    // TODO: play door locked sound effect
  }

  // if in bounds, and not going through a wall, only the tile type determines accessability:

  const tileTypeIndex = mapTiles[tileCoords.y][tileCoords.x];
  const tileType = tileTypes[tileTypeIndex];

  console.assert(tileType, 'Unexpected out of bounds position: ' + JSON.stringify(position));

  return !tileType.blocker;
}

function getTimeDilationFactor(speed) {
  console.assert(speed >= 0 && speed < 1, 'Invalid speed: ' + speed);
  return 1 / Math.sqrt(1-speed*speed);
}

function updateTimeDisplay() {
  let month = Math.floor(dayCount / 30);
  month = (month+'').padStart(2, '0');
  dayCountArea.text(`${month}-${dayCount-month*30} `);

  let hours = Math.floor(timeCount / (60*60*1000));
  let timeCountLeft = timeCount-hours*60*60*1000;
  let minutes = Math.floor(timeCountLeft / (60*1000));
  timeCountLeft = timeCountLeft-minutes*60*1000;
  let seconds = Math.floor(timeCountLeft / 1000);
  timeCountLeft = timeCountLeft-seconds*1000;
  let ms = timeCountLeft;

  hours = (hours+'').padStart(2, '0');
  minutes = (minutes+'').padStart(2, '0');
  seconds = (seconds+'').padStart(2, '0');
  ms = (ms+'').padStart(3, '0');

  timeCountArea.text(`${hours}:${minutes}:${seconds}.${ms}`);

  const timeSincePing = timeCount - lastPing;
  const timeToNextPing = 10*1000 - 1 - timeSincePing; // we cheat a MS to fix layout shift at exactly 10k - sue me
  let pingSeconds = Math.floor(timeToNextPing / 1000);
  timeCountLeft = timeToNextPing-pingSeconds*1000;
  let pingMs = timeCountLeft;

  //pingSeconds = (pingSeconds+'').padStart(2, '0'); // we don't need to pad this as ET ping time is always <10
  pingMs = (Math.floor(pingMs/10)+'').padStart(2, '0');
  nextPingArea.text(`${pingSeconds}.${pingMs}`);
}

// it's enough to call this after the speed changes, which is not every frame!
function updateSpeedDisplay() {
  speedArea.text(`${shipSpeed} c (~${Math.round(299792 * shipSpeed)} km/s)`);
  const dilationPercent = getTimeDilationFactor(shipSpeed) * 100 - 100;
  dilationArea.text(`, time dilation ${Math.floor(dilationPercent)}%`);
}

function movePlayer() {
  if (movementDisabled) {
    // movement is disabled during game end - maybe later during special events too?
    return;
  }

  const playerSpeed = (DEBUG && keysPressed.shift) ? PLAYER_SPEED * 4 : PLAYER_SPEED;
  // move player according to current pressed keys
  if (keysPressed.up) {
    if (!canMoveTo({x: player.x, y: player.y - playerSpeed})) {
      return;
    }
    player.y = Math.max(0, player.y - playerSpeed);
    playerInViewport.y = player.y - viewport.y;
    if (playerInViewport.y <= MAP_SCROLL_PADDING) { // TODO: use padding+speed in bounds checks?
      viewport.y = Math.max(0, viewport.y - playerSpeed);
      playerInViewport.y = player.y - viewport.y;
    }
  }
  if (keysPressed.right) {
    if (!canMoveTo({x: player.x + PLAYER_SIZE/2 + playerSpeed, y: player.y})) {
      return;
    }
    player.x = Math.min(MAX_WIDTH - PLAYER_SIZE/2, player.x + playerSpeed);
    playerInViewport.x = player.x - viewport.x;
    if (playerInViewport.x >= WIDTH - MAP_SCROLL_PADDING) {
      viewport.x = Math.min(MAX_WIDTH - WIDTH, viewport.x + playerSpeed);
      playerInViewport.x = player.x - viewport.x;
    }
  }
  if (keysPressed.down) {
    if (!canMoveTo({x: player.x, y: player.y + PLAYER_SIZE/2 + playerSpeed})) {
      return;
    }
    player.y = Math.min(MAX_HEIGHT - PLAYER_SIZE/2, player.y + playerSpeed);
    playerInViewport.y = player.y - viewport.y;
    if (playerInViewport.y >= HEIGHT- MAP_SCROLL_PADDING) {
      viewport.y = Math.min(MAX_HEIGHT - HEIGHT, viewport.y + playerSpeed);
      playerInViewport.y = player.y - viewport.y;
    }
  }
  if (keysPressed.left) {
    if (!canMoveTo({x: player.x - playerSpeed, y: player.y})) {
      return;
    }
    player.x = Math.max(0, player.x - playerSpeed);
    playerInViewport.x = player.x - viewport.x;
    if (playerInViewport.x <= MAP_SCROLL_PADDING) {
      viewport.x = Math.max(0, viewport.x - playerSpeed);
      playerInViewport.x = player.x - viewport.x;
    }
  }
  // set player orientation
  if (keysPressed.up && keysPressed.right) {
    playerAngle = 315 * Math.PI / 180;
  } else if (keysPressed.right && keysPressed.down) {
    playerAngle = 45 * Math.PI / 180;
  } else if (keysPressed.down && keysPressed.left) {
    playerAngle = 135 * Math.PI / 180;
  } else if (keysPressed.left && keysPressed.up) {
    playerAngle = 225 * Math.PI / 180;
  } else if (keysPressed.up) {
    playerAngle = 270 * Math.PI / 180;
  } else if (keysPressed.right) {
    playerAngle = 0 * Math.PI / 180;
  } else if (keysPressed.down) {
    playerAngle = 90 * Math.PI / 180;
  } else if (keysPressed.left) {
    playerAngle = 180 * Math.PI / 180;
  }
}

function startPing() {
  // NB: hit detection is in drawFrame
  lastPing = timeCount;
  sweepPassedPlayer = false;

  pingSweep.addClass('transition-on visible');
  setTimeout(() => {
    pingSweep.removeClass('transition-on visible triggered');
  }, SWEEP_DURATION + 500);
}

let movementDisabled = false;
function endGame() {
  const msg = $('<div></div').addClass('game-over-msg').insertAfter(msgLogArea);
  msg.text('Game over!');
  movementDisabled = true;

  setTimeout(() => {
    // reset to starting state
    player.x = 2100;
    player.y = 200;

    viewport.x = 900;
    viewport.y = 0;

    playerInViewport.x = player.x - viewport.x;
    playerInViewport.y = player.y - viewport.y;

    shipSpeed = 0.5;
    shipSpeedLimit = 0.7;

    mapObjects.filter(o=>o.type === 'terminal').forEach(o=>{
      o.readCount = 0;
    });

    movementDisabled = false;
    msg.remove();
  }, 4000);
}

let lastDrawTime = 0;
let sweepPassedPlayer = false;
function drawFrame(timestamp) {
  // update timers
  const timeSinceLastDraw = timestamp-lastDrawTime;
  const timeDilationFactor = getTimeDilationFactor(shipSpeed);
  const timeSpentOnEarth = timeSinceLastDraw / timeDilationFactor;
  timeCount+=Math.round(timeSpentOnEarth);
  if (timeCount - lastPing > 10000) {
    startPing();
  }
  lastDrawTime = timestamp;
  updateTimeDisplay();

  // sweep hit scanning
  if (timeCount - lastPing < SWEEP_DURATION) {
    // a sweep is in progress: we estimate the sweeper position (not exact, as it is controlled by a css transition)
    // we do a position check the first time we find the sweep further right than the player
    const sweepEstimate = (timeCount - lastPing)/SWEEP_DURATION * (WIDTH+SWEEP_WIDTH);
    if (!sweepPassedPlayer && sweepEstimate > player.x - viewport.x) { // NB: for now, we sweep only the viewport
      sweepPassedPlayer = true;
      const playerTile = getTileCoords(player);
      const tileTypeIndex = mapTiles[playerTile.y][playerTile.x];
      const tileType = tileTypes[tileTypeIndex];
      if (!tileType.allowedDuringPing) {
        console.warn('Ping - Busted!');
        pingSweep.addClass('triggered')
        // TODO: play triggered sound
        endGame();
      } else {
        console.log('Ping OK');
      }
    }
  }

  // clear canvas -- not needed since starfield backdrop
  // ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // draw star field
  // TODO: use separate canvas - only draw once (either layer or draw from canvas image source)
  ctx.save();
  ctx.fillStyle = '#252015';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  startField.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.restore();

  // optionally print debug info to DOM
  if (DEBUG) {
    debugLog.text(
      JSON.stringify(player) + ', v: ' + JSON.stringify(viewport) +
      ', tile: ' + JSON.stringify(getTileCoords(player)) +
      ', since ping: ' + (timeCount-lastPing)
    );
  }

  // move player
  movePlayer();

  // draw tiles
  mapTiles.forEach((row, rowIndex) => {
    row.forEach((t, colIndex) => {
      const tile = tileTypes[t];

      console.assert(typeof tile === 'object', 'Invalid tile type: ' + t + ' -> ' + tile);
      if (tile.transparent) {
        return; // transparent tiles are simply not drawn
      }
      console.assert(tile.image, 'Missing tile image for tile type ' + t);

      ctx.drawImage(tile.image, colIndex*TILE_SIZE - viewport.x, rowIndex*TILE_SIZE - viewport.y, TILE_SIZE, TILE_SIZE);
    });
  });

  // draw walls
  mapWalls.forEach(w => {
    ctx.beginPath();
    ctx.moveTo(w.x - viewport.x, w.y - viewport.y);
    const h = (w.orientation === 'horizontal');
    ctx.lineTo(w.x - viewport.x + (h? 100 : 0), w.y - viewport.y + (h? 0 : 100));
    ctx.stroke();
  });

  // draw objects
  ctx.save();
  mapObjects.forEach(o => {
    if (o.type === 'gridmark') {
      ctx.fillStyle = 'gray';
      const size = 2;
      ctx.fillRect(o.x - viewport.x, o.y - viewport.y, size, size);
    } else {
      // regular object
      console.assert(o.image, 'Malformed map object in drawFrame:', o);
      ctx.drawImage(o.image, o.x - viewport.x, o.y - viewport.y, o.w || 100, o.h || 100);
    }
  });
  ctx.restore();

  // draw player
  ctx.save();
  ctx.translate(playerInViewport.x, playerInViewport.y)
  ctx.rotate(playerAngle);
  ctx.translate(-playerInViewport.x, -playerInViewport.y)
  ctx.drawImage(playerImage, playerInViewport.x-PLAYER_SIZE/2, playerInViewport.y-PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
  ctx.restore();

  requestAnimationFrame(drawFrame);
}

const keysPressed = {
  up:    false,
  right: false,
  down:  false,
  left:  false
};

function processInteraction(skip) {
  // if speed control open, apply and close
  const ss = $('#speed-selector');
  if (ss.length) {
    shipSpeed = roundTo1Decimal(parseFloat(ss.text()));
    updateSpeedDisplay();
    msgLogArea.empty();
    ss.remove();
    return;
  }

  let terminal;
  mapObjects.filter(o=>o.type==='terminal').forEach(o => {
    if (Math.abs(player.x - o.x) < NEARBY_RADIUS && Math.abs(player.y - o.y) < NEARBY_RADIUS) {
      terminal = o;
    }
  });

  if (!terminal) {
    console.log('No terminal nearby - this is fine, user could be just clicking');
    // we also check for the speed control item
    const speedControlIndex = mapObjects.findIndex(o=>o.type==='speed-control');
    console.assert(speedControlIndex > -1, 'Couldnt find speed control');
    const speedControl = mapObjects[speedControlIndex];
    if (Math.abs(player.x - speedControl.x) < NEARBY_RADIUS && Math.abs(player.y - speedControl.y) < NEARBY_RADIUS) {
      showSpeedControls(speedControl);
    }
  } else {
    readFromTerminal(terminal, skip);
  }
}

function showSpeedControls(obj) {
  msgLogArea.empty();
  showMessage('Use left and right to set speed, enter to confirm.', 'system');
  const ss = $('<div id="speed-selector"></div>').insertAfter(msgLogArea);
  ss.css({
    top: `${obj.y - viewport.y - 30}px`,
    left: `${obj.x - viewport.x}px`
  });
  ss.text(shipSpeed);
}

function roundTo1Decimal(num) {
  return Math.round(num * 10) / 10;
}

$(document).ready(function() {
  debugLog = $('#debug-log');

  dayCountArea = $('#day-value');
  timeCountArea = $('#time-value');
  nextPingArea = $('#next-ping-value');
  speedArea = $('#speed-value');
  dilationArea = $('#time-dilation-value');

  updateSpeedDisplay();

  pingSweep = $('#sweep');
  // FIXME: add transition property dynamically (does not seem to work with .css()?)
  //        toggling it could allow to start sweep far off-screen depending on player position (ie. at the actual edge of the map)

  msgLogArea = $('#msg-log');

  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  // we set the size of the container explicitly to be able to clip the sweep
  $('#container').css({
    width: WIDTH,
    height: HEIGHT
  });

  ctx = canvas.getContext('2d');

  ctx.fillStyle = '#008800';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;

  // keypress event listeners
  document.addEventListener('keydown', event => {
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keysPressed.up = true;
        event.preventDefault();
        break;
      case 'KeyD':
      case 'ArrowRight':
        event.preventDefault();
        if ($('#speed-selector').length) {
          let val = parseFloat($('#speed-selector').text());
          val = roundTo1Decimal(Math.min(shipSpeedLimit, val+0.1));
          $('#speed-selector').text(val);
        } else {
          keysPressed.right = true;
        }
        break;
      case 'KeyS':
      case 'ArrowDown':
        keysPressed.down = true;
        event.preventDefault();
        break;
      case 'KeyA':
      case 'ArrowLeft':
        event.preventDefault();
        if ($('#speed-selector').length) {
          let val = parseFloat($('#speed-selector').text());
          val = roundTo1Decimal(Math.max(0, val-0.1));
          $('#speed-selector').text(val);
        } else {
          keysPressed.left = true;
        }
        break;
      case 'KeyE':
      case 'Enter':
        processInteraction();
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keysPressed.shift = true;
        event.preventDefault();
        break;
      case 'Space':
        event.preventDefault();
        break;
      case 'Escape':
        event.preventDefault();
        processInteraction(true); // skip
        break;
    }
  });

  document.addEventListener('keyup', event => {
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        keysPressed.up = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keysPressed.right = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keysPressed.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keysPressed.left = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keysPressed.shift = false;
        break;
    }
  });

  // start first ping - later pings are started when 10 seconds have passed
  startPing();

  // start animation loop
  drawFrame(0);
});
