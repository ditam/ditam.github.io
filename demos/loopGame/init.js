
/* game is a shared global between all js code -> this file should be loaded first. */
const game = {
  state: {
    choices: 0,
    currentTaskIndex: 0,
    forcedScrolling: false,
    forcedScrollCount: 0,
    forcedWaiting: false,
    hasTask: false,
    lastDrawTime: 0,
    mapBounds: {
      x: STAGE_BOUNDS[0].x,
      y: STAGE_BOUNDS[0].y
    },
    // objects is a coordinate-ordered list of map elements,
    // so that no z-index needs to be considered when iterating and rendering
    objects: [],
    player: {
      x: 420,
      y: 270
    },
    resetting: false,
    viewport: {
      x: 0,
      y: 0
    }
  },
  meta: {
    resets: 0,
    stage: 1 // TODO: switch to 0-based, it's confusing...
  }
};

// add debug placeholder objects
game.state.objects = [
  {
    x: 420,
    y: 210,
    isHidden: false,
    assetURL: 'assets/house.png',
    id: 'home',
    width: 96,
    height: 96
  },
  {
    x: 470,
    y: 150,
    isHidden: false,
    assetURL: 'assets/tree1.png',
  },
  {
    x: 390,
    y: 170,
    isHidden: false,
    assetURL: 'assets/tree-group.png',
  },
  {
    x: 240,
    y: 200,
    isHidden: true,
    assetURL: 'assets/tree3.png',
  },
  {
    x: 100,
    y: 350,
    isHidden: true,
    assetURL: 'assets/well.png',
    id: 'well'
  },
  {
    x: 110,
    y: 90,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 70,
    y: 320,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
  },
  {
    x: 90,
    y: 450,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
  },
  {
    x: 550,
    y: 330,
    isHidden: true,
    assetURL: 'assets/fire-out.png',
    id: 'fire-out'
  },
  {
    x: 550,
    y: 330,
    isHidden: true,
    forceHide: true, // can only be revealed explicitly, not via discovery
    assetURL: 'assets/fire.png',
    id: 'fire'
  },
  {
    x: 510,
    y: 230,
    isHidden: true,
    assetURL: 'assets/fence.png',
    id: 'fence',
    width: 64,
    height: 37
  },
  {
    x: 560,
    y: 230,
    isHidden: true,
    assetURL: 'assets/fence-broken.png',
    id: 'fence-broken',
    width: 64,
    height: 37
  },
  {
    x: 560,
    y: 230,
    isHidden: true,
    forceHide: true,
    assetURL: 'assets/fence.png',
    id: 'fence-mended',
    width: 64,
    height: 37
  },
  {
    x: 680,
    y: 120,
    isHidden: true,
    assetURL: 'assets/tree2.png',
  },
  {
    x: 780,
    y: 50,
    isHidden: true,
    assetURL: 'assets/tree2.png',
  },
  {
    x: 530,
    y: 460,
    isHidden: true,
    assetURL: 'assets/tree2.png',
  },
  {
    x: 780,
    y: 440,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
  },

  //          -------      STAGE 2      -------

  {
    x: 1060,
    y: 150,
    isHidden: true,
    assetURL: 'assets/bridge-long.png',
    id: 'bridge',
    width: 185,
    height: 70
  },
  {
    x: 1060,
    y: 0,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 64,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 128,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 192,
    isHidden: true,
    assetURL: 'assets/river-straight.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 256,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 320,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 384,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 448,
    isHidden: true,
    assetURL: 'assets/river-straight.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 512,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 576,
    isHidden: true,
    assetURL: 'assets/river-straight.png',
    class: 'river-scenery'
  },
  {
    x: 1060,
    y: 640,
    isHidden: true,
    assetURL: 'assets/river-bendy.png',
    class: 'river-scenery'
  },
  {
    x: 1020,
    y: 460,
    isHidden: true,
    assetURL: 'assets/water-mill.png',
    class: 'river-scenery'
  },
  {
    x: 990,
    y: 400,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
    class: 'river-scenery'
  },
  {
    x: 960,
    y: 470,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
    class: 'river-scenery'
  },
  {
    x: 1110,
    y: 70,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
    class: 'river-scenery'
  },
  {
    x: 1110,
    y: 360,
    isHidden: true,
    assetURL: 'assets/tree-group.png',
    class: 'river-scenery'
  },
  {
    x: 1100,
    y: 400,
    isHidden: true,
    assetURL: 'assets/tree2.png',
    class: 'river-scenery'
  },
  {
    x: 1100,
    y: 120,
    isHidden: true,
    assetURL: 'assets/tree2.png',
    class: 'river-scenery'
  },
  {
    x: 960,
    y: 30,
    isHidden: true,
    assetURL: 'assets/tree1.png',
    class: 'river-scenery'
  },
  {
    x: 1030,
    y: 250,
    isHidden: true,
    assetURL: 'assets/tree3.png',
    class: 'river-scenery'
  },
  {
    x: 1130,
    y: 450,
    isHidden: true,
    assetURL: 'assets/tree3.png',
    class: 'river-scenery'
  },
  {
    x: 1200,
    y: 330,
    isHidden: true,
    assetURL: 'assets/tree3.png'
  },
  {
    x: 1320,
    y: 560,
    isHidden: true,
    assetURL: 'assets/tree1.png'
  },
  {
    x: 1400,
    y: 210,
    isHidden: true,
    assetURL: 'assets/tree3.png'
  },
  {
    x: 1320,
    y: 60,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 1300,
    y: 110,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  // dark forest patch - end of stage 2
  {
    x: 150,
    y: 510,
    isHidden: true,
    assetURL: 'assets/tree-group.png'
  },
  {
    x: 250,
    y: 570,
    isHidden: true,
    assetURL: 'assets/tree-group.png'
  },
  {
    x: 0,
    y: 580,
    isHidden: true,
    assetURL: 'assets/tree-group.png'
  },
  {
    x: 380,
    y: 600,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 430,
    y: 620,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 400,
    y: 610,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 200,
    y: 630,
    isHidden: true,
    assetURL: 'assets/tree2.png'
  },
  {
    x: 270,
    y: 580,
    isHidden: true,
    assetURL: 'assets/tree1.png'
  },
  {
    x: 100,
    y: 610,
    isHidden: true,
    assetURL: 'assets/tree1.png'
  },
  {
    x: 140,
    y: 620,
    isHidden: true,
    assetURL: 'assets/tree1.png'
  },
  {
    x: 550,
    y: 600,
    isHidden: true,
    assetURL: 'assets/tree-group.png'
  },

  //          -------      STAGE 3      -------
  // western part is randomly generated

  {
    x: 950, // NB: also used in generateRandomArea below!
    y: 950,
    isHidden: true,
    assetURL: 'assets/watchtower.png',
    width: 120,
    height: 138,
    id: 'tower'
  },
  {
    x: 850,
    y: 850,
    isHidden: true,
    assetURL: 'assets/flag.png',
  },
  {
    x: 1050,
    y: 850,
    isHidden: true,
    assetURL: 'assets/flag.png',
  },
  {
    x: 1050,
    y: 1050,
    isHidden: true,
    assetURL: 'assets/flag.png',
  },
  {
    x: 850,
    y: 1050,
    isHidden: true,
    assetURL: 'assets/flag.png',
  },

  // shoreline
  {
    x: 1700,
    y: 650,
    isHidden: false, // too large for the standard discovery logic
    assetURL: 'assets/coast.png',
    width: 94,
    height: 1300
  },
  {
    x: 1760,
    y: 0,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 75,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1740,
    y: 150,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 225,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1770,
    y: 300,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 375,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1740,
    y: 450,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 525,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1740,
    y: 600,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 675,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1750,
    y: 750,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 825,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1750,
    y: 900,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 975,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1730,
    y: 1050,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 1125,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1730,
    y: 1200,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  {
    x: 1760,
    y: 1275,
    isHidden: false,
    assetURL: 'assets/waves.png',
    width: 48,
    height: 48
  },
  // palm trees on beach
  {
    x: 1430,
    y: 150,
    isHidden: true,
    assetURL: 'assets/palm-large.png'
  },
  {
    x: 1530,
    y: 275,
    isHidden: true,
    assetURL: 'assets/palm.png'
  },
  {
    x: 1500,
    y: 400,
    isHidden: true,
    assetURL: 'assets/palm.png'
  },
  {
    x: 1650,
    y: 475,
    isHidden: true,
    assetURL: 'assets/palm.png'
  },
  {
    x: 1590,
    y: 660,
    isHidden: true,
    assetURL: 'assets/palm-large.png'
  },
  {
    x: 1650,
    y: 1000,
    isHidden: true,
    assetURL: 'assets/palm-large.png'
  },
  {
    x: 1600,
    y: 1100,
    isHidden: true,
    assetURL: 'assets/palm.png'
  },
  {
    x: 1680,
    y: 820,
    isHidden: true,
    assetURL: 'assets/lighthouse.png',
    width: 128,
    height: 128,
    id: 'lighthouse'
  },
  {
    x: 1760,
    y: 900,
    isHidden: true,
    forceHide: true,
    assetURL: 'assets/ship.png',
    class: 'ship'
  },
  {
    x: 1750,
    y: 690,
    isHidden: true,
    forceHide: true,
    assetURL: 'assets/ship.png',
    class: 'ship'
  },
  {
    x: 1800,
    y: 670,
    isHidden: true,
    forceHide: true,
    assetURL: 'assets/ship.png',
    class: 'ship'
  },
  {
    x: 1780,
    y: 1050,
    isHidden: true,
    forceHide: true,
    assetURL: 'assets/ship.png',
    class: 'ship'
  },
  {
    x: 1000, // NB: used below in generateRandomArea
    y: 740,
    isHidden: true,
    assetURL: 'assets/lake.png',
    width: 462,
    height: 148,
    id: 'lake'
  }
];

function getRandomItem(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function getRandomInt(min, max) { // inclusive
  return Math.floor(Math.random() * (max - min + 1) + min);
}

(function generateRandomArea() {
  const assetChoices = ['tree1', 'tree2', 'tree3', 'tree-group', 'rocks', 'rocksA'];
  for (let i = 0; i < 100; i++) {
    const x = getRandomInt(0, 1500);
    const y = getRandomInt(650, 1300);
    // do not populate the tower and lake areas
    if (
      ! (
        (Math.abs(x-950) < 50 || Math.abs(y-950) < 50) || // near tower
        (y>680 && y<815 && x>775 && x<1230) // near lake
      )
    ) {
      game.state.objects.push({
        x: x,
        y: y,
        isHidden: true,
        assetURL: `assets/${getRandomItem(assetChoices)}.png`
      });
    }
  }
})();

// DEBUG: generate gridmarks
// for (let i=0; i<25; i++) {
//   for (let j=0; j<15; j++) {
//     game.state.objects.push({
//       x: i*100,
//       y: j*100
//     });
//   }
// }
