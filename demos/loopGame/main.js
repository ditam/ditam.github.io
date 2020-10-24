function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

// a cache of HTMLImageElements, so that objects with the same asset use the same img object
const assetURL2ImageCache = {};
const bgImg = new Image();
bgImg.src = 'assets/mapBackground.png';

// sort objects by coordinates (so that z-index appearance is correct when drawn in order)
// re-sort every time a new element is added, or make sure it is inserted at the right place!
function sortObjects() {
  game.state.objects.sort(function(a, b) {
    // drawing will iterate this in reverse (so it can remove items), so we put lowest y coord last
    if (a.y < b.y) {
      return 1;
    } else if (a.y === b.y) {
      return (a.x <= b.x)? 1 : -1;
    } else {
      return -1;
    }
  });
}
sortObjects();

// annotate each object with an image element of the obj asset
game.state.objects.forEach((obj) => createImageRefFromObjAsset(obj));

// save initial state (will reset to this)
game._initialState = clone(game.state);
console.log('saved initial state:', game._initialState);

function createImageRefFromObjAsset(obj) {
  if (obj.assetURL) {
    const url = obj.assetURL;
    if (!(url in assetURL2ImageCache)) {
      const image = $('<img>').attr('src', url);
      assetURL2ImageCache[url] = image.get(0);
    }
    obj.image = assetURL2ImageCache[url];
  } else {
    console.error('Object has no asset URL:', obj);
  }
}

let DEBUG_LOG;

// TODO: add param for duration - if missing, do not erase
let timeout = null;
function writeMessage(msg) {
  const target = $('#text-overlay');
  const textSizer = $('#text-measure-helper');

  if (soundsOn) {
    writingSound.play();
  }

  if (timeout) {
    // TODO: make this more robust against race conditions...
    console.warn('Previous timeout is active! target state:', target.text());
    clearTimeout(timeout);
  }
  target.empty();

  // to align the text to the center,
  // we write it to the hidden helper, and measure its width
  textSizer.empty();
  textSizer.text(msg);
  target.css('left', (WIDTH - textSizer.outerWidth())/2 + 'px');

  let i = 0;

  (function _writeChar() {
    if (i < msg.length) {
      target.text(target.text() + msg[i]);
      i++;
      timeout = setTimeout(_writeChar, MESSAGE_CHAR_DELAY);
    } else {
      writingSound.pause();
      timeout = null;
    }
  })();
}

function writeDelayedMessage(msg, delay) {
  // TODO: guard against scheduling on top of existing. Shared timeout vars?
  return setTimeout(
    () => writeMessage(msg),
    delay
  );
}

/* rendering and simulation globals */
let ctx; // canvas 2d context
let startTime;
let canvasCover;

/* user interaction state */
const keysPressed = {
  up: false,
  right: false,
  down: false,
  left: false
};

let lastStepWasLeftFooted = false;
function addFootstep(x, y, angle) {
  // TODO: maybe keep these in separate collection rather than in objects?
  const footstepObj = {
    type: 'footstep',
    x: x,
    y: y,
    angle: angle,
    isFadingOut: true,
    fadeCounter: 0,
    assetURL: 'assets/footprint.png',
    width: 15,
    height: 15,
  };

  // instead of writing the general math, slanted angles are the combination of the
  // straight components with half lengths
  switch (angle) {
    case 0:
      footstepObj.offsetX = lastStepWasLeftFooted? 6 : -6;
      break;
    case (45 * Math.PI / 180):
      footstepObj.offsetX = lastStepWasLeftFooted? 3 : -3;
      footstepObj.offsetY = lastStepWasLeftFooted? 3 : -3;
      break;
    case (90 * Math.PI / 180):
      footstepObj.offsetY = lastStepWasLeftFooted? 6 : -6;
      break;
    case (135 * Math.PI / 180):
      footstepObj.offsetY = lastStepWasLeftFooted? 3 : -3;
      footstepObj.offsetX = lastStepWasLeftFooted? 3 : 9;
      break;
    case (180 * Math.PI / 180):
      footstepObj.offsetX = lastStepWasLeftFooted? 6 : 18;
      break;
    case (225 * Math.PI / 180):
      footstepObj.offsetX = lastStepWasLeftFooted? 3 : 9;
      footstepObj.offsetY = lastStepWasLeftFooted? 3 : 9;
      break;
    case (270 * Math.PI / 180):
      footstepObj.offsetY = lastStepWasLeftFooted? 6 : 18;
      break;
    case (315 * Math.PI / 180):
      footstepObj.offsetY = lastStepWasLeftFooted? 3 : 9;
      footstepObj.offsetX = lastStepWasLeftFooted? 3 : -3;
      break;
  }

  createImageRefFromObjAsset(footstepObj);
  game.state.objects.push(footstepObj);

  lastStepWasLeftFooted = !lastStepWasLeftFooted;
}

function showChoiceMarker() {
  $('#choice-marker').fadeTo(600, 1);
}

function hideChoiceMarker() {
  $('#choice-marker').fadeTo(300, 0);
}

function checkCoordsForCurrentTask(coords) {
  const currentTask = game.tasks[game.state.currentTaskIndex];
  return currentTask.checker(coords, game.state);
}

function startTask() {
  game.state.hasTask = true;
  const currentTask = game.tasks[game.state.currentTaskIndex];
  currentTask.setData(game.state.player, game.state);
  if (currentTask.startMessage) {
    writeMessage(currentTask.startMessage);
  }
  if (currentTask.startEffect) {
    currentTask.startEffect(game.state);
  }
  console.log(`Starting task #${game.state.currentTaskIndex}`);
}

function processCompletedTask() {
  console.log('task completed!');
  const currentTask = game.tasks[game.state.currentTaskIndex];

  // write task end-message
  if (currentTask.endMessage) {
    writeMessage(currentTask.endMessage);
  } else {
    // bugfix: the final task uses a special message setup, so we skip the clearing
    // (we call this method to call the task's endEffect for good measure, but this could be cleaned up...)
    if (currentTask.id !== 'stage-3-free-roam') {
      writeMessage('');
    }
  }

  // apply task effects
  if (currentTask.endEffect) {
    const choicesBefore = game.state.choices;
    currentTask.endEffect(game.state);
    if (game.state.choices > choicesBefore) {
      showChoiceMarker();
    }
  }

  // cycle to next task with a timeout

  game.state.hasTask = false; // startTask will set it to true, see timeout below

  if (currentTask.blocksAutoContinue) {
    // should be used sparingly - make sure that these tasks process a choice
    return;
  }

  if (game.state.currentTaskIndex === game.tasks.length -1) {
    console.log('---no more tasks---');
  } else {
    game.state.currentTaskIndex = game.state.currentTaskIndex + 1;
    // TODO: allow tasks to specify delay
    setTimeout(startTask, 1000);
  }

}

function processChoice() {
  game.state.choices--;
  hideChoiceMarker();
  game.state.hasTask = false;
  if (game.meta.stage === 1) {
    writeMessage('But he decided to do something different.');
    game.meta.stage++;
    game.state.currentTaskIndex = game.state.currentTaskIndex + 1;
    setTimeout(startTask, 500);
  } else if (game.meta.stage === 2) {
    writeMessage('No, I... misremembered. That day he felt brave.');
    // in stage 2, there's no task to open the map bounds
    game.state.mapBounds = STAGE_BOUNDS[2];
    game.meta.stage++;
    game.state.currentTaskIndex = game.state.currentTaskIndex + 1;
    setTimeout(startTask, 5000);
  }
}

function resetInitialState() {
  game.meta.resets++;
  game.meta.stage = 1;
  game.state = clone(game._initialState);
  // clone does not carry the HTMLImageElements, so we re-add them
  // (assetURL2ImageCache persists, so this should not be expensive)
  game.state.objects.forEach(function(obj) {
    if (obj.assetURL) {
      createImageRefFromObjAsset(obj);
    }
  });
}

function resetGame(customMessage) {
  // show reset-loop message
  game.state.resetting = true;
  // we delay a bit, but once we start fading, we immediately remove the text.
  setTimeout(function() {
    canvasCover.fadeTo(1000, 1);
    $('.text-overlay').empty().addClass('resetting');
  }, 400);

  hideChoiceMarker();

  writeDelayedMessage(customMessage || 'You\'re not listening...', 2000);
  let restartDelay = 10*1000;
  if (!customMessage && game.meta.resets <= 1) {
    writeDelayedMessage('I\'m telling you a story.', 6000);
  } else {
    restartDelay = 6000;
  }

  // schedule actual reset
  setTimeout(
    function() {
      // it needs to be empty, but keeping the resetting class while fading, so no padding appears
      $('.text-overlay').empty();
      canvasCover.fadeTo(1000, 0, function() {
        // after the fade is complete, remove the class which switches back to the original style
        $('.text-overlay').removeClass('resetting')
        startDay(); // -> this can now safely display new msgs
      });
      game.state.resetting = false;
      resetInitialState();
    },
    restartDelay
  );
}

let drawCount = 0;
let bgPattern = null;
function draw(timestamp) {
  // during resets drawing is paused
  if (game.state.resetting) {
    drawCount = 0;
    requestAnimationFrame(draw);
    return;
  };

  if (!startTime) {
    startTime = timestamp;
    game.state.lastDrawTime = timestamp;
  }

  // shorthands
  const player = game.state.player;
  const viewport = game.state.viewport;
  const mapBounds = game.state.mapBounds;

  // draw background
  if (!bgPattern) {
    bgPattern = ctx.createPattern(bgImg, 'repeat');
  }
  ctx.save();
  ctx.fillStyle = bgPattern;
  ctx.translate(-viewport.x, -viewport.y);
  ctx.fillRect(0 - viewport.x, 0 - viewport.y, 4096, 4096);
  ctx.restore();

  const playerInViewport = {
    x: player.x-viewport.x,
    y: player.y-viewport.y
  };

  let hasMoved = false;
  const movementAngles = [];

  // TODO: separate drawing and simulation

  // adjust viewport when forced scrolling - blocks manual movement
  if (game.state.forcedScrolling) {
    // NB: be careful when scrolling more than MAP_SCROLL_PADDING, you can push the player out of the viewport
    if (game.state.forcedScrollCount < 500 && viewport.x + WIDTH < mapBounds.x) {
      game.state.forcedScrollCount++;
      viewport.x++;
    } else {
      game.state.forcedScrolling = false;
      game.state.forcedScrollCount = 0;
    }
  } else if (!game.state.forcedWaiting) {
    // move player according to current pressed keys
    if (keysPressed.up) {
      player.y = Math.max(0, player.y - PLAYER_SPEED);
      playerInViewport.y = player.y - viewport.y;
      if (playerInViewport.y <= MAP_SCROLL_PADDING) { // TODO: use padding+speed in bounds check?
        viewport.y = Math.max(0, viewport.y - PLAYER_SPEED);
        playerInViewport.y = player.y - viewport.y;
      }
      hasMoved = true;
      movementAngles.push(0);
    }
    if (keysPressed.right) {
      player.x = Math.min(mapBounds.x, player.x + PLAYER_SPEED);
      // clip to shoreline
      if (player.x > 1695) {
        player.x = 1695;
      }
      playerInViewport.x = player.x - viewport.x;
      if (playerInViewport.x >= WIDTH - MAP_SCROLL_PADDING) {
        viewport.x = Math.min(mapBounds.x - WIDTH, viewport.x + PLAYER_SPEED);
        playerInViewport.x = player.x - viewport.x;
      }
      hasMoved = true;
      movementAngles.push(90 * Math.PI / 180);
    }
    if (keysPressed.down) {
      player.y = Math.min(mapBounds.y, player.y + PLAYER_SPEED);
      playerInViewport.y = player.y - viewport.y;
      if (playerInViewport.y >= HEIGHT- MAP_SCROLL_PADDING) {
        viewport.y = Math.min(mapBounds.y - HEIGHT, viewport.y + PLAYER_SPEED);
        playerInViewport.y = player.y - viewport.y;
      }
      hasMoved = true;
      movementAngles.push(180 * Math.PI / 180);
    }
    if (keysPressed.left) {
      player.x = Math.max(0, player.x - PLAYER_SPEED);
      playerInViewport.x = player.x - viewport.x;
      if (playerInViewport.x <= MAP_SCROLL_PADDING) {
        viewport.x = Math.max(0, viewport.x - PLAYER_SPEED);
        playerInViewport.x = player.x - viewport.x;
      }
      hasMoved = true;
      movementAngles.push(270 * Math.PI / 180);
    }
  }


  // add footstep every once in a while
  if (hasMoved && !(drawCount%FOOTSTEP_FREQUENCY)) {
    let angle = game.utils.avg(movementAngles);

    // Bugfix: if we are going up & left, rewrite angle manually to 315deg
    // (This is an inherent problem with the avg method, if we pushed 360 instead of 0, up-right would need fixing.)
    if (keysPressed.left && keysPressed.up) angle = 315 * Math.PI / 180;

    addFootstep(player.x, player.y, angle);
    game.utils.discoverObjectsInRange(player.x, player.y, game.state.objects);
  }

  // check if movement satisfies current task
  if (game.state.hasTask) {
    const taskState = checkCoordsForCurrentTask({x: player.x, y: player.y});
    if (taskState.failed) {
      if (game.state.choices > 0) {
        processChoice();
      } else {
        resetGame();
      }
    } else if (taskState.completed) {
      processCompletedTask();
    }
  }

  // DEBUG logging
  if (keysPressed.debug) {
    DEBUG_LOG.text(`Player at (x${player.x}-y${player.y})`);
  } else {
    DEBUG_LOG.empty();
  }

  // draw objects
  ctx.fillStyle = 'black';
  // we iterate backwards to be able to remove faded items without complications
  for (let i = game.state.objects.length -1; i >= 0; i--) {
    const obj = game.state.objects[i];
    if (obj.assetURL) {
      ctx.save();

      let w, h;
      if (obj.width && obj.height) {
        w = obj.width;
        h = obj.height;
      } else {
        w = OBJECT_DEFAULT_SIZE;
        h = OBJECT_DEFAULT_SIZE;
      }

      // if the object is fading, apply an alpha to the drawing context
      if (obj.isFadingIn) {
        ctx.globalAlpha = obj.fadeCounter / FADE_IN_DURATION;
        obj.fadeCounter++;
        if (obj.fadeCounter >= FADE_IN_DURATION) {
          obj.isFadingIn = false;
          delete obj.fadeCounter;
        }
      } else if (obj.isFadingOut) {
        obj.fadeCounter++;

        // special exemption for shoreline to keep half-faded footsteps
        if (obj.x > 1520 && obj.fadeCounter > (FADE_OUT_DELAY+FADE_OUT_DURATION)/2) {
          obj.fadeCounter--;
        }

        if (obj.fadeCounter > FADE_OUT_DELAY) {
          let newAlpha = 1 - (obj.fadeCounter - FADE_OUT_DELAY) / FADE_OUT_DURATION;
          // with the delay, we might get out of semantic range - easiest to just clip
          ctx.globalAlpha = Math.max(0, Math.min(1, newAlpha));

          if ((obj.fadeCounter - FADE_OUT_DELAY) >= FADE_OUT_DURATION) {
            // we delete the faded out object entirely
            game.state.objects.splice(i, 1);
          }
        }
      }

      if (!obj.isHidden) {
        let dX = dY = 0;
        if (obj.offsetX) dX = obj.offsetX;
        if (obj.offsetY) dY = obj.offsetY;
        const computedX = obj.x - w/2 - viewport.x + dX;
        const computedY = obj.y - h/2 - viewport.y + dY;
        ctx.translate(computedX, computedY);
        ctx.rotate(obj.angle || 0);
        ctx.drawImage(obj.image, 0, 0, w, h);
      }

      // reset any transformations
      ctx.restore();
    } else {
      // fallback if no asset: draw a rect (used by debug gridpoints for now)
      ctx.fillRect(obj.x-1.5-viewport.x, obj.y-1.5-viewport.y, 3, 3);
    }
  };

  // draw player
  ctx.fillStyle = '#9e2222';
  ctx.beginPath();
  ctx.arc(playerInViewport.x, playerInViewport.y, 10, 0, 2 * Math.PI);
  ctx.fill();

  game.state.lastDrawTime = timestamp;
  drawCount++;
  requestAnimationFrame(draw);
}

function startDay() {
  writeDelayedMessage('It was a day just like any other.', 1000);

  const DEBUG_MODE = false;

  if (DEBUG_MODE) {
    // free-roam
    setTimeout(
      function() {
        game.state.mapBounds = STAGE_BOUNDS[2];
        // jump to any task with an id
        game.state.currentTaskIndex = game.utils.getTaskIndexFromID('stage-3-free-roam');
        console.log('Jumping to task: #', game.state.currentTaskIndex);
        startTask();
      },
      200
    );
  } else {
    // start game tasks
    setTimeout(
      function() {
        // TODO: only start task after msg is fully shown
        startTask();
      },
      5000
    );
  }

}
