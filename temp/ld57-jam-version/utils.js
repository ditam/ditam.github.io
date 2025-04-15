import constants from './constants.js';

export default {
  getRandomItem: function (array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  noop: function(){ return; },

  forEachCoord: function(f) {
    for (let i=0; i<constants.GRID_ROWS; i++) {
      for (let j=0; j<constants.GRID_COLS; j++) {
        f(j, i);
      }
    }
  },
}
