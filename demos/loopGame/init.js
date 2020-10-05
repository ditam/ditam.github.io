
/* game is a shared global between all js code -> this file should be loaded first. */
const game = {
  state: {
    choices: 0,
    currentTaskIndex: 0,
    hasTask: false,
    lastDrawTime: 0,
    mapBounds: {
      x: 800,
      y: 500
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
    stage: 1
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
];

// DEBUG: generate gridmarks
// for (let i=0; i<25; i++) {
//   for (let j=0; j<10; j++) {
//     game.state.objects.push({
//       x: i*100,
//       y: j*100
//     });
//   }
// }
