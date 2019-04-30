
const PARAMS = Object.freeze({
  MAP_ROWS: 6,
  MAP_COLS: 5,
  OFFSET_X: 550,
  OFFSET_Y: 30,
  TILE_WIDTH: 140,
  ASPECT: 150/108,
  GRID_COLOR: 0xcccccc,
  HOVER_COLOR: 0xcccc00,
  SELECT_COLOR: 0xdd3333
});

// NB: size adjustment values are additive, derive from TILE_WIDTH
const objectData = {
  bush:         { assetURL: 'assets/bush.png', humanCount: 2, isAlive: true, class: 'misc', dW: -PARAMS.TILE_WIDTH*0.1 },
  coffin:       { assetURL: 'assets/coffin.png', class: 'misc', dW: -PARAMS.TILE_WIDTH*0.15 },
  crypt:        { assetURL: 'assets/crypt.png', class: 'misc' },
  death:        { assetURL: 'assets/death.png' },
  debris:       { assetURL: 'assets/debris.png', class: 'misc' },
  empty:        { assetURL: 'assets/empty.png', isAlive: true, class: 'empty' },
  empty_dead:   { assetURL: 'assets/empty.png', class: 'empty' },
  gravestone_1: { assetURL: 'assets/gravestone_1.png', class: 'human', dW: -PARAMS.TILE_WIDTH*0.15, dH: PARAMS.TILE_WIDTH*0.1 },
  gravestone_2: { assetURL: 'assets/gravestone_2.png', class: 'human', dH: PARAMS.TILE_WIDTH*0.15 },
  gravestone_3: { assetURL: 'assets/gravestone_3.png', class: 'human' },
  gravestone_4: { assetURL: 'assets/gravestone_4.png', class: 'human', dW: -PARAMS.TILE_WIDTH*0.15, dH: PARAMS.TILE_WIDTH*0.15 },
  ground:       { assetURL: 'assets/ground.png' },
  ground_dead:  { assetURL: 'assets/ground_dead.png' },
  house_1:      { assetURL: 'assets/house_1.png', humanCount: 20, isAlive: true, class: 'human', dH: PARAMS.TILE_WIDTH*0.15 },
  house_2:      { assetURL: 'assets/house_2.png', humanCount: 30, isAlive: true, class: 'human', dH: PARAMS.TILE_WIDTH*0.15 },
  house_3:      { assetURL: 'assets/house_3.png', humanCount: 40, isAlive: true, class: 'human', dH: PARAMS.TILE_WIDTH*0.15 },
  house_4:      { assetURL: 'assets/house_4.png', humanCount: 120, isAlive: true, class: 'human', dH: PARAMS.TILE_WIDTH*0.45 },
  house_5:      { assetURL: 'assets/house_5.png', humanCount: 10, isAlive: true, class: 'human', dW: -PARAMS.TILE_WIDTH*0.15, dX: PARAMS.TILE_WIDTH*0.1 },
  icon_check:   { assetURL: 'assets/icon_check.png' },
  icon_people:  { assetURL: 'assets/icon_people.png' },
  icon_skull:   { assetURL: 'assets/icon_skull.png' },
  rocks_1:      { assetURL: 'assets/rocks_1.png', isAlive: true, class: 'misc', dW: -PARAMS.TILE_WIDTH*0.1, dH: -PARAMS.TILE_WIDTH*0.1 },
  rocks_2:      { assetURL: 'assets/rocks_2.png', isAlive: true, class: 'misc', dW: -PARAMS.TILE_WIDTH*0.1, dX: PARAMS.TILE_WIDTH*0.05 },
  tree_1:       { assetURL: 'assets/tree_1.png', humanCount: 2, isAlive: true, class: 'tree', dH: PARAMS.TILE_WIDTH*0.2 },
  tree_2:       { assetURL: 'assets/tree_2.png', humanCount: 2, isAlive: true, class: 'tree', dH: PARAMS.TILE_WIDTH*0.2 },
  tree_3:       { assetURL: 'assets/tree_3.png', humanCount: 2, isAlive: true, class: 'tree', dH: PARAMS.TILE_WIDTH*0.2 },
  tree_4:       { assetURL: 'assets/tree_4.png', humanCount: 5, isAlive: true, class: 'tree', dH: PARAMS.TILE_WIDTH*0.2 },
  trunk_1:      { assetURL: 'assets/trunk_1.png', class: 'tree', dW: -PARAMS.TILE_WIDTH*0.15, dX: PARAMS.TILE_WIDTH*0.05 },
  trunk_2:      { assetURL: 'assets/trunk_2.png', class: 'tree', dW: -PARAMS.TILE_WIDTH*0.1, dH: PARAMS.TILE_WIDTH*0.15 }
}

const app = new PIXI.Application({
  antialias: true,
  width: 1000,
  height: 600
});
document.body.appendChild(app.view);
app.stage.buttonMode = true;
app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, 800, 600);
app.stage.cursor = 'url(assets/cursor.png) 5 5, auto';﻿
const gridlines = new PIXI.Graphics();
const loader = PIXI.loader;

for (let key in objectData) {
  const sprite = objectData[key];
  loader.add(key, sprite.assetURL);
}

const map = {};
const objects = {};
(function initMap() {
  const aliveObjectNames = Object.keys(objectData).filter(key => !!objectData[key].isAlive);
  for (let i=0; i<PARAMS.MAP_ROWS; i++) {
    const mapRow = {};
    const objectsRow = {};
    for (let j=0; j<PARAMS.MAP_COLS; j++) {
      mapRow[j] = 'ground';
      objectsRow[j] = [
        getRandomItem(aliveObjectNames),
        getRandomItem(aliveObjectNames),
        getRandomItem(aliveObjectNames),
        getRandomItem(aliveObjectNames)
      ];
    }
    map[i] = mapRow;
    objects[i] = objectsRow;
  }
})();

(function drawGrid() {
  gridlines.lineStyle(1.5, PARAMS.GRID_COLOR);
  const x0 = PARAMS.OFFSET_X;
  const y0 = PARAMS.OFFSET_Y;
  const tileW = PARAMS.TILE_WIDTH;
  const tileH = PARAMS.TILE_WIDTH/PARAMS.ASPECT;
  for (let i = 0;i<PARAMS.MAP_ROWS+1; i++) {
    gridlines.moveTo(
      x0 + 0.5*tileW - i*tileW/2,
      y0 + i*tileH/2
    );
    gridlines.lineTo(
      x0 + 0.5*tileW + PARAMS.MAP_COLS * tileW/2  - i*tileW/2,
      y0 + PARAMS.MAP_COLS * tileH/2 + i*tileH/2
    );
  }
  for (let j = 0;j<PARAMS.MAP_COLS+1; j++) {
    gridlines.moveTo(
      x0 + 0.5*tileW + j*tileW/2,
      y0 + j*tileH/2
    );
    gridlines.lineTo(
      x0 + 0.5*tileW - PARAMS.MAP_ROWS * tileW/2 + j*tileW/2,
      y0 + PARAMS.MAP_ROWS * tileH/2 + j*tileH/2
    );
  }
})();

let mouseX = 0;
let mouseY = 0;

const tileW = PARAMS.TILE_WIDTH;
const tileH = tileW/PARAMS.ASPECT;

const x0 = PARAMS.OFFSET_X;
const y0 = PARAMS.OFFSET_Y;  

const hoverMarker = new PIXI.Graphics();
hoverMarker.moveTo(x0+tileW/2, y0);
hoverMarker.lineStyle(4, PARAMS.HOVER_COLOR);  
hoverMarker.lineTo(x0+tileW, y0+tileH/2);
hoverMarker.lineTo(x0+tileW/2, y0+tileH);
hoverMarker.lineTo(x0, y0+tileH/2);
hoverMarker.lineTo(x0+tileW/2, y0);

const selectionMarker = new PIXI.Graphics();
selectionMarker.moveTo(x0+tileW/2, y0);
selectionMarker.lineStyle(4, PARAMS.SELECT_COLOR);  
selectionMarker.lineTo(x0+tileW, y0+tileH/2);
selectionMarker.lineTo(x0+tileW/2, y0+tileH);
selectionMarker.lineTo(x0, y0+tileH/2);
selectionMarker.lineTo(x0+tileW/2, y0);
selectionMarker.visible = false;

function displayGroundForTile(i, j, resources) {
  const currentTileKey = map[i][j];
  const currentTile = objectData[currentTileKey];
  const ground = new PIXI.Sprite(resources[currentTileKey].texture);
  ground.width = tileW + (currentTile.dW | 0);
  ground.height = tileH + (currentTile.dH | 0);
  ground.x = PARAMS.OFFSET_X - i*tileW/2 + j*tileW/2 + (currentTile.dX | 0);
  ground.y = PARAMS.OFFSET_Y + i*tileH/2 + j*tileH/2 + (currentTile.dY | 0);      
  app.stage.addChild(ground);
}

function displayObjectsForTile(i, j, resources) {
  const tileBaseX = PARAMS.OFFSET_X - i*tileW/2 + j*tileW/2;
  const tileBaseY = PARAMS.OFFSET_Y + i*tileH/2 + j*tileH/2; 
  const currentTileObjects = objects[i][j];
  currentTileObjects.forEach(function(objKey, index) {
    const currentObj = objectData[objKey];
    const objW = tileW / 3;
    const objH = objW/PARAMS.ASPECT;
    const objSprite = new PIXI.Sprite(resources[objKey].texture);
    objSprite.width = objW + (currentObj.dW | 0);
    objSprite.height = objH + (currentObj.dH | 0);
    const positions = {
      0: { x: objW,      y: objW*0.2 },
      1: { x: objW*0.3,  y: objW*0.65 },
      2: { x: objW*1.7,  y: objW*0.65 },
      3: { x: objW,      y: objW*1.1 }
    }
    objSprite.x = tileBaseX + positions[index].x + (currentObj.dX | 0);
    objSprite.y = tileBaseY + positions[index].y + (currentObj.dY | 0) - (currentObj.dH | 0);
    app.stage.addChild(objSprite);
  });
}

function rebuildScene(resources) {
  app.stage.removeChildren();
  
  for (let i=0; i<PARAMS.MAP_ROWS; i++) {
    for (let j=0; j<PARAMS.MAP_COLS; j++) {
      displayGroundForTile(i, j, resources);
    }
  }
  app.stage.addChild(gridlines);
  app.stage.addChild(hoverMarker);
  app.stage.addChild(selectionMarker);

  for (let i=0; i<PARAMS.MAP_ROWS; i++) {
    for (let j=0; j<PARAMS.MAP_COLS; j++) {
      displayObjectsForTile(i, j, resources);
    }
  }
}

let scythemen = {};
let scythemenLimit = 1;
let scythemanCost = 25;
let roundCount = 0;
let deadCount = 0;
let livingCount = 0;

for (let i=0; i<PARAMS.MAP_ROWS; i++) {
  for (let j=0; j<PARAMS.MAP_COLS; j++) {
    objects[i][j].forEach(function(objectName) {
      const oData = objectData[objectName];
      livingCount += oData.humanCount | 0;
    });
  }
}
  
function updateCounters() {
  document.getElementById('people-counter').innerHTML = livingCount;
  document.getElementById('dead-counter').innerHTML = deadCount;
  document.getElementById('scythemen-counter').innerHTML = scythemenLimit - Object.keys(scythemen).length;
  document.getElementById('round-counter').innerHTML = roundCount;
  document.getElementById('cost-counter').innerHTML = scythemanCost;
}
updateCounters();

document.getElementById('buy-button').addEventListener('click', function(e) {
  const cost = scythemanCost;
  if (deadCount <= cost) {
    alert('You don\'t have enough dead souls to buy a new scytheman. Reap more.');
  } else {
    deadCount = deadCount - cost;
    scythemanCost = cost + 50;
    scythemenLimit++;
  }
  updateCounters();
});


  
loader.load((loader, resources) => {
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  bgMusic = new Audio('assets/bg_music.ogg'); 
  bgMusic.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false);

  rebuildScene(resources);

  app.ticker.add(() => {
    const hoveredTile = getTileFromCoords(mouseX, mouseY);
    if (hoveredTile) {
      const tileX = - hoveredTile.row*tileW/2 + hoveredTile.col*tileW/2;
      const tileY = hoveredTile.row*tileH/2 + hoveredTile.col*tileH/2;
      hoverMarker.x = tileX;
      hoverMarker.y = tileY;
    }
  });
  
  let selectedTile = {
    row: undefined,
    col: undefined
  };
  
  document.addEventListener('click', function(e) {
    const clickedTile = getTileFromCoords(e.clientX, e.clientY);
    if (clickedTile) {
      selectedTile.row = clickedTile.row;
      selectedTile.col = clickedTile.col;
      const tileX = - clickedTile.row*tileW/2 + clickedTile.col*tileW/2;
      const tileY = clickedTile.row*tileH/2 + clickedTile.col*tileH/2;
      selectionMarker.x = tileX;
      selectionMarker.y = tileY;
      selectionMarker.visible = true;
    } else {
      selectionMarker.visible = false;
    }
  });
  
  document.addEventListener('keypress', function(e) {
    if (e.key === 's' && selectionMarker.visible) {
      const id = selectedTile.row + '|' + selectedTile.col;
      if (id in scythemen) {
        app.stage.removeChild(scythemen[id]);
        delete scythemen[id];
      } else if (Object.keys(scythemen).length < scythemenLimit) {
        bgMusic.play();
        const marker = new PIXI.Sprite(resources.death.texture);
        marker.width = tileW / 2;
        marker.height = marker.width / 555 * 640; // maintain aspect ratio of image
        marker.x = PARAMS.OFFSET_X - selectedTile.row*tileW/2 + selectedTile.col*tileW/2 + tileW * 0.22;
        marker.y = PARAMS.OFFSET_Y + selectedTile.row*tileH/2 + selectedTile.col*tileH/2 + tileH * 0.1;
        app.stage.addChild(marker);
        scythemen[id] = marker;
      }
      updateCounters();
    } else if (e.key === 'r' && selectionMarker.visible) {
      killMarkedTiles();
      updateCounters();
    }
  });
  
  function killMarkedTiles() {
    Object.keys(scythemen).forEach(function(id){
      const marker = scythemen[id];
      let row, col;
      [row, col] = id.split('|');
      
      // replace ground
      map[row][col] = 'ground_dead';
      
      // remove scytheman marker
      app.stage.removeChild(scythemen[id]); // currently this is redundant as we are rebuilding the scene anyway
      delete scythemen[id];

      // replace objects on tile
      const objectList = objects[row][col];
      const deadObjectList = objectList.map(objectKey => {
        const objParams = objectData[objectKey];
        deadCount += objParams.humanCount | 0;
        livingCount -= objParams.humanCount | 0;
        const deadItemsInClass = Object.keys(objectData).filter(key => objectData[key].isAlive!==true && objectData[key].class===objParams.class);
        return getRandomItem(deadItemsInClass);
      });
      objects[row][col] = deadObjectList;
    });
    roundCount++;
    updateCounters();
    rebuildScene(resources);
    checkVictory();
  }
});

function checkVictory() {
  for (let i=0; i<PARAMS.MAP_ROWS; i++) {
    for (let j=0; j<PARAMS.MAP_COLS; j++) {
      if (map[i][j] !== 'ground_dead') return;
    }
  }
  alert('Congratulations! You\'ve reaped all living souls in '+roundCount+' rounds.');
}

function getTileFromCoords(clientX, clientY) {
  // We calculate the hit tile directly from the coordinates, returning undefined if no tile is hit.
  // This is done by translating (x,y) into the isometric coordinate system (projecting to the axes),
  // then using simple division by the known tile sizes to get the row and column values directly.
  
  // To follow the logic of this function, consider the triangle ABC where A is (offsetX, offsetY), B is (x, y),
  // and C is the sought projection of B onto the isometric axis (for simplicity, in the clientX < offsetX case):
  // - The isometric axis tilt alpha is known from the tile sizing params
  // - AB distance is known
  // - Angle CAB can be calculated by projecting B onto the horizontal line of A and forming the right triangle ABB'
  // - Note that angle BCA is 2*alpha (bisect with a horizontal line to see)
  // - With CAB, BCA and AB known, the law of sines yields the missing sides of the ABC triangle.
  // (Where AC is the sought projection to the left axis and CB is the projection to the right axis.)
  const x = clientX - PARAMS.OFFSET_X - PARAMS.TILE_WIDTH/2;
  const y = clientY - PARAMS.OFFSET_Y;  
  const tileW = PARAMS.TILE_WIDTH;
  const tileH = PARAMS.TILE_WIDTH/PARAMS.ASPECT;
  const tileEdge = Math.sqrt((tileW/2)*(tileW/2)+(tileH/2)*(tileH/2));
  const axisTilt = Math.asin((tileH/2)/tileEdge);
  const AB = Math.sqrt(x*x+y*y);
  const ABangleFromHorizontal = Math.asin(y/AB);
  
  if (ABangleFromHorizontal < axisTilt) return; // surely no hovered tile

  const CAB = ABangleFromHorizontal - axisTilt;
  const BCA = 2*axisTilt;
  const ABC = Math.PI - CAB - BCA;
  
  // applying the law of sines to ABC:
  let projectionY = AB / Math.sin(BCA) * Math.sin(ABC);
  let projectionX = AB / Math.sin(BCA) * Math.sin(CAB);
  
  // Until this point, we assumed that clientX < offsetX, but if it was not the case, the math results in switched numbers
  if (x >= 0) [projectionY, projectionX] = [projectionX, projectionY];
  
  const hoveredRow = Math.floor(projectionY/tileEdge);
  const hoveredCol = Math.floor(projectionX/tileEdge);
  
  // clamp to actual grid size:
  if (hoveredRow >= PARAMS.MAP_ROWS) return;
  if (hoveredCol >= PARAMS.MAP_COLS) return;
  
  return {
    row: hoveredRow,
    col: hoveredCol
  };
}

function getRandomItem(array) {
  return array[Math.floor(Math.random()*array.length)]; 
}