import constants from './constants.js';

let _id_counter = 0;

const utils = {
  arraysEqual: function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  },

  clamp: function(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  dist: function(a, b) {
    console.assert(a.hasOwnProperty('x') && a.hasOwnProperty('y') && b.hasOwnProperty('x') && b.hasOwnProperty('y'), 'Invalid dist targets:', a, b);
    const dX = a.x-b.x;
    const dY = a.y-b.y;
    return Math.sqrt(dX*dX + dY*dY);
  },

  drawDebugGrid: function(ctx, viewport) {
    ctx.save();

    function setCTXColor(i, max) {
      if (i === 1 || i === max) {
        ctx.strokeStyle = 'red';
      } else {
        ctx.strokeStyle = 'black';
      }
    }

    const colCount = constants.MAP_WIDTH / constants.GRID_CELL_WIDTH - 1;
    const rowCount = constants.MAP_HEIGHT / constants.GRID_CELL_HEIGHT - 1;
    for (let i=1; i<=colCount; i++) {
      setCTXColor(i, colCount);
      ctx.beginPath();
      ctx.moveTo(i * constants.GRID_CELL_WIDTH - viewport.x, 0-viewport.y);
      ctx.lineTo(i * constants.GRID_CELL_WIDTH - viewport.x, constants.MAP_HEIGHT-viewport.y);
      ctx.stroke();
    }

    for (let j=1; j<=rowCount; j++) {
      setCTXColor(j, rowCount);
      ctx.beginPath();
      ctx.moveTo(0 - viewport.x, j * constants.GRID_CELL_HEIGHT - viewport.y);
      ctx.lineTo(constants.MAP_WIDTH - viewport.x, j * constants.GRID_CELL_HEIGHT - viewport.y);
      ctx.stroke();
    }

    ctx.restore();
  },

  getNewID: function() {
    _id_counter++;
    return 'id_' + _id_counter;
  },

  getRandomInt: function(min, max) { // min and max included
    if (typeof max === 'undefined') {
      max = min;
      min = 0;
    }
    return Math.floor(Math.random() * (max - min + 1) + min);
  },

  getRandomItem: function (array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  getRandomName: function() {
    let name = '';
    if (Math.random() < 0.3) {
      name += 'Captain ';
    }
    name+=utils.getRandomItem([
      'Joe', 'Rocco', 'Bert', 'Tuco', 'Emiliano', 'Sal', 'Poe', 'Bud', 'Mog',
      'Mos', 'Tim', 'Riff', 'Tanaka', 'Yv', 'Bo'
    ]);
    name+=' ' + utils.getRandomItem([
      'Black', 'Carr', 'Dim', 'Sprowles', 'Dandy', 'Roccino', 'Tang', 'Zapp',
      'Elm', 'Def', 'Spaceman', 'Kenobi', 'Eggert'
    ]);
    return name;
  },

  getTargetVector: function(object, target) {
    // returns a unit vector pointing from object to target
    const dist = utils.dist(object, target);
    const dX = (target.x - object.x) / dist;
    const dY = (target.y - object.y) / dist;
    return {
      dX: dX,
      dY: dY
    };
  },

  removeItem: function (array, item) {
    const i = array.indexOf(item);
    console.assert(i > -1, 'Remove target object not found in array', item);
    array.splice(i, 1);
  },

  sum: function(array) {
    return array.reduce((partialSum, a) => partialSum + a, 0);
  }
}

export default utils;