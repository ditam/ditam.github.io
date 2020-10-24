
/* Game constants */

const WIDTH = 900;
const HEIGHT = 500;

// note that this is related to footstep frequency below
const PLAYER_SPEED = 2;
// draws a new footstep every this many frames - note player speed above
// -- has to be an integer (used in a modulo check)
const FOOTSTEP_FREQUENCY = 8;

// The map will scroll if the player is within this distance from the viewport edge
const MAP_SCROLL_PADDING = 150;

const MESSAGE_CHAR_DELAY = 35;

const STAGE_BOUNDS = [
  {
    x: WIDTH,
    y: HEIGHT
  },
  {
    x: 1400,
    y: 650
  },
  {
    x: 1800,
    y: 1300
  }
];

const FADE_IN_DURATION = 100;
const FADE_OUT_DURATION = 150;
// objects don't start fading out until hitting this delay
// (effectively extends duration without starting to visibly fade)
const FADE_OUT_DELAY = 20;

// The player is considered to be "at" an object within this radius
const ACTIVITY_RADIUS = 40;

const OBJECT_DEFAULT_SIZE = 64;

// objects within this radius from the player are discovered
const OBJECT_DISCOVERY_RANGE = 150;
