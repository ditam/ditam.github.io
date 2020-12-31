
(function() {
  let currentTask = null;

  game.tasks = [
    {
      id: 'go-to-well',
      startMessage: 'Like every morning, he went straight to the well.',
      endMessage: null,
      startEffect: function(gameState) {
        const well = game.utils.findObjectByID('well', gameState.objects);
        game.utils.fadeInObject(well);
      },
      setData: function(player, gameState) {
        // TODO: move target to params, then we can create "go-to-x" task type
        const well = game.utils.findObjectByID('well', gameState.objects);
        currentTask = {
          target: {
            x: well.x,
            y: well.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          }
        };
        currentTask.acceptableBounds = {
          x0: Math.min(currentTask.target.x, currentTask.startPosition.x) - 50,
          y0: Math.min(currentTask.target.y, currentTask.startPosition.y) - 50,
          x1: Math.max(currentTask.target.x, currentTask.startPosition.x) + 50,
          y1: Math.max(currentTask.target.y, currentTask.startPosition.y) + 50
        }
        // TODO: save times - will allow waiting tasks and speed-based checks
      },
      checker: function(player) {
        const taskState = {
          completed: false,
          failed: false
        };

        const bounds = currentTask.acceptableBounds;
        if (
          player.x < bounds.x0 || player.y < bounds.y0 ||
          player.x > bounds.x1 || player.y > bounds.y1
        ) {
          taskState.failed = true;
        }

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);

        return taskState;
      }
    },
    {
      id: 'go-to-house',
      startMessage: 'With the water he walked carefully back to the house.',
      endMessage: null,
      startEffect: function(gameState) {
        const well = game.utils.findObjectByID('well', gameState.objects);
        game.utils.fadeInObject(well);
      },
      setData: function(player, gameState) {
        // TODO: refactor: generic straight to target type fn
        const home = game.utils.findObjectByID('home', gameState.objects);
        currentTask = {
          target: {
            x: home.x,
            y: home.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          }
        };
        currentTask.acceptableBounds = {
          x0: Math.min(currentTask.target.x, currentTask.startPosition.x) - 50,
          y0: Math.min(currentTask.target.y, currentTask.startPosition.y) - 50,
          x1: Math.max(currentTask.target.x, currentTask.startPosition.x) + 50,
          y1: Math.max(currentTask.target.y, currentTask.startPosition.y) + 50
        }
      },
      checker: function(player) {
        const taskState = {
          completed: false,
          failed: false
        };

        const bounds = currentTask.acceptableBounds;
        if (
          player.x < bounds.x0 || player.y < bounds.y0 ||
          player.x > bounds.x1 || player.y > bounds.y1
        ) {
          taskState.failed = true;
        }

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);

        return taskState;
      }
    },
    {
      id: 'free-roam-to-fire',
      startMessage: 'He had gotten cold, so he went to set the fire.',
      startEffect: function(gameState) {
        const fireOut = game.utils.findObjectByID('fire-out', gameState.objects);
        game.utils.fadeInObject(fireOut);
      },
      endEffect: function(gameState) {
        game.utils.swapObjects('fire-out', 'fire');
        game.state.forcedWaiting = true;
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('fire', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startTime: gameState.lastDrawTime
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);
        taskState.failed = gameState.lastDrawTime - currentTask.startTime > 60*1000;

        return taskState;
      }
    },
    {
      id: 'stay-at-fire',
      startMessage: 'And he just stood there for a while to warm up.',
      startEffect: function(gameState) {
        const waitTimeout = this.startMessage.length * MESSAGE_CHAR_DELAY;
        setTimeout(function() {
          game.state.forcedWaiting = false;
        }, waitTimeout + 200);
      },
      setData: function(player, gameState) {
        currentTask = {
          startPosition: {
            x: player.x,
            y: player.y
          },
          target: game.utils.findObjectByID('fire', gameState.objects),
          startTime: gameState.lastDrawTime
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.failed = !(
          game.utils.isObjectInProximity(player, currentTask.target) ||
          game.utils.isObjectInProximity(player, currentTask.startPosition)
        );

        taskState.completed = gameState.lastDrawTime - currentTask.startTime > 5000;

        return taskState;
      }
    },
    {
      id: 'mend-fence-freeroam',
      startMessage: 'He decided to mend the broken fence by his house.',
      startEffect: function(gameState) {
        const fenceBroken = game.utils.findObjectByID('fence-broken', gameState.objects);
        game.utils.fadeInObject(fenceBroken);
      },
      endEffect: function(gameState) {
        game.utils.swapObjects('fence-broken', 'fence-mended');
        gameState.mapBounds = STAGE_BOUNDS[1];
        gameState.choices++;
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('fence-broken', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startTime: gameState.lastDrawTime
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);
        taskState.failed = gameState.lastDrawTime - currentTask.startTime > 60*1000;

        return taskState;
      }
    },
    {
      id: 'go-home-end-stage',
      startMessage: 'It was time for him to go home.',
      endEffect: function(gameState) {
        if (game.meta.resets > 10) {
          resetGame('He didn\'t -need- to go home, of course...');
        } else {
          resetGame('He felt like he was missing out on something.');
        }
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('home', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          },
          startTime: gameState.lastDrawTime
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);

        taskState.failed = player.x > currentTask.startPosition.x + 50;

        return taskState;
      }
    },
    {
      id: 'stage-2-start',
      setData: function() {
        // dummy // TODO make optional
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.completed = player.x > 850 && player.y < 270;

        return taskState;
      }
    },
    {
      id: 'stage-2-bridge',
      startEffect: function(gameState) {
        const target = game.utils.findObjectByID('bridge', gameState.objects);
        game.utils.fadeInObject(target);
        game.state.forcedScrolling = true;
        game.state.forcedScrollCount = 0;
      },
      startMessage: 'He was happy to see the old bridge, and headed straight for it.',
      endEffect: function() {
        game.state.forcedWaiting = true;
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('bridge', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          }
        };
        currentTask.acceptableBounds = {
          x0: Math.min(currentTask.target.x, currentTask.startPosition.x) - 50,
          y0: Math.min(currentTask.target.y, currentTask.startPosition.y) - 50,
          x1: Math.max(currentTask.target.x, currentTask.startPosition.x) + 50,
          y1: Math.max(currentTask.target.y, currentTask.startPosition.y) + 50
        }
      },
      checker: function(player) {
        const taskState = {
          completed: false,
          failed: false
        };

        const bounds = currentTask.acceptableBounds;
        if (
          player.x < bounds.x0 || player.y < bounds.y0 ||
          player.x > bounds.x1 || player.y > bounds.y1
        ) {
          taskState.failed = true;
        }

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);

        return taskState;
      }
    },
    {
      id: 'stage-2-stay-at-bridge',
      startMessage: 'From the bridge, he took a long look at the riverside.',
      startEffect: function(gameState) {
        const targets = gameState.objects.filter((obj) => obj.class==='river-scenery');
        const waitTimeout = this.startMessage.length * MESSAGE_CHAR_DELAY;
        setTimeout(function() {
          targets.forEach(game.utils.fadeInObject);
          game.state.forcedWaiting = false;
        }, waitTimeout + 200);
      },
      endMessage: 'The view inspired him to explore.',
      endEffect: function(gameState) {
        gameState.choices++;
      },
      setData: function(player, gameState) {
        currentTask = {
          startPosition: {
            x: player.x,
            y: player.y
          },
          target: game.utils.findObjectByID('bridge', gameState.objects),
          startTime: gameState.lastDrawTime
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.failed = !(
          game.utils.isObjectInProximity(player, currentTask.target) ||
          game.utils.isObjectInProximity(player, currentTask.startPosition)
        );

        taskState.completed = gameState.lastDrawTime - currentTask.startTime > 6000;

        return taskState;
      }
    },
    {
      id: 'stage-2-finale-trigger',
      setData: function() {
        // dummy // TODO make optional
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        // triggered in bottom left corner outside of stage1
        taskState.completed = (
          (player.x < 700 && player.y > 500) || // either arriving from the east
          (player.x < 450 && player.y > 400) // or from the top
        );

        return taskState;
      }
    },
    {
      id: 'stage-2-end-choice',
      startMessage: 'The wolves in the south scared him, so he headed straight home.',
      blocksAutoContinue: true,
      endEffect: function(gameState) {
        if (game.meta.resets > 20) {
          resetGame('He wished he had dared the wolves.');
        } else {
          resetGame('He felt like he was missing out on something.');
        }
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('home', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          }
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target);

        taskState.failed = player.x < 250 && player.y > 500;

        return taskState;
      }
    },
    {
      id: 'stage-3-opener',
      startMessage: 'Heading south, he saw parts of the forest he\'d never seen before.',
      endEffect: function(gameState) {
        const target = game.utils.findObjectByID('tower', gameState.objects);
        game.utils.fadeInObject(target);
        game.state.forcedScrolling = true;
        game.state.forcedScrollCount = 0;
      },
      setData: function() {
        // dummy // TODO make optional
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };
        // Failed if goes back to stage 1, completed if crosses random area's east edge
        taskState.failed = (
          player.y < 500 ||
          // also if they start east in the stage 2 corridor
          (player.y < 650 && player.x > 400)
        );

        taskState.completed = player.x > 700;


        return taskState;
      }
    },
    {
      id: 'stage-3-tower',
      startMessage: 'He noticed the tower, and decided to climb it.',
      endEffect: function(gameState) {
        const targets = gameState.objects.filter((obj) => obj.y > 600 && obj.x < 1600);
        setTimeout(function() {
          targets.forEach(game.utils.fadeInObject);
        }, 2000);
        game.state.forcedScrolling = true;
        game.state.forcedScrollCount = 0;
      },
      setData: function(player, gameState) {
        const target = game.utils.findObjectByID('tower', gameState.objects);
        currentTask = {
          target: {
            x: target.x,
            y: target.y
          },
          startPosition: {
            x: player.x,
            y: player.y
          }
        };
        currentTask.acceptableBounds = {
          x0: Math.min(currentTask.target.x, currentTask.startPosition.x) - 100,
          y0: Math.min(currentTask.target.y, currentTask.startPosition.y) - 100,
          x1: Math.max(currentTask.target.x, currentTask.startPosition.x) + 100,
          y1: Math.max(currentTask.target.y, currentTask.startPosition.y) + 100
        }
      },
      checker: function(player) {
        const taskState = {
          completed: false,
          failed: false
        };

        const bounds = currentTask.acceptableBounds;
        if (
          player.x < bounds.x0 || player.y < bounds.y0 ||
          player.x > bounds.x1 || player.y > bounds.y1
        ) {
          taskState.failed = true;
        }

        taskState.completed = game.utils.isObjectInProximity(player, currentTask.target, true);

        return taskState;
      }
    },
    {
      id: 'stage-3-free-roam',
      startMessage: 'From here he could see all the way to the seashore.',
      endEffect: function(gameState) {
        setTimeout(function() {
          resetGame('I\'ve told you this story before.');
        }, 15000);
      },
      setData: function(player, gameState) {
        currentTask = {
          visitedLake: false,
          visitedBeach: false,
          visitedLighthouse: false,
          visitedBottomCorner: false,
          visitedTopCorner: false,
          pickedUpChest: false,
          lighthouse: game.utils.findObjectByID('lighthouse', gameState.objects),
          msgTimeout: null
        };
      },
      checker: function(player, gameState) {
        const taskState = {
          completed: false,
          failed: false
        };

        const x = player.x;
        const y = player.y;

        if (!currentTask.visitedBottomCorner && x>1380 && y>1030) {
          currentTask.visitedBottomCorner = true;
        }
        if (!currentTask.visitedTopCorner && x>1450 && y<220) {
          currentTask.visitedTopCorner = true;
        }
        if (!currentTask.visitedLake && y>680 && y<815 && x>775 && x<1230) {
          currentTask.visitedLake = true;
          writeMessage('He visited the lake, but he had no interest in fishing.');
          if (currentTask.msgTimeout) {
            clearTimeout(currentTask.msgTimeout);
          }
          currentTask.msgTimeout = writeDelayedMessage('', 7000);
        }
        if (!currentTask.visitedBeach && x>1520) {
          currentTask.visitedBeach = true;
          writeMessage('The sand of the beach held his footsteps forever.');
          if (currentTask.msgTimeout) {
            clearTimeout(currentTask.msgTimeout);
          }
          currentTask.msgTimeout = writeDelayedMessage('', 7000);
        }
        if (!currentTask.visitedLighthouse && game.utils.isObjectInProximity(player, currentTask.lighthouse)) {
          currentTask.visitedLighthouse = true;
          const ships = gameState.objects.filter((obj) => obj.class==='ship');
          ships.forEach(game.utils.fadeInObject);
          writeMessage('From the lighthouse, he could see ships leaving the shore.');
          if (currentTask.msgTimeout) {
            clearTimeout(currentTask.msgTimeout);
          }
          currentTask.msgTimeout = writeDelayedMessage('', 7000);
          currentTask.chest = {
            isHidden: true,
            assetURL: 'assets/chest.png',
            id: 'chest'
          }
          if (currentTask.visitedBottomCorner) {
            currentTask.chest.x = 1630;
            currentTask.chest.y = 50;
          } else {
            currentTask.chest.x = 1630;
            currentTask.chest.y = 1230;
          }
          createImageRefFromObjAsset(currentTask.chest);
          game.state.objects.push(currentTask.chest);
        }
        if (currentTask.chest && game.utils.isObjectInProximity(player, currentTask.chest)) {
          currentTask.pickedUpChest = true;

          // mark all other flags to avoid weird bugs - the game is ending anyway
          currentTask.visitedLake = true;
          currentTask.visitedBeach = true;
          currentTask.visitedLighthouse = true;
          clearTimeout(currentTask.msgTimeout);

          // block movement to suggest the game is ending (I guess)
          game.state.forcedWaiting = true;

          writeMessage('He came across a chest in the sands.');
          writeDelayedMessage('What was in the chest, is a story for an other day...', 6000);
          writeDelayedMessage('', 12000);
        }

        // This task can not be failed.
        taskState.completed = currentTask.pickedUpChest;

        return taskState;
      }
    }
  ];
})();
