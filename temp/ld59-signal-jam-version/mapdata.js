import constants from './constants.js';
import utils from './utils.js';

function generateMapObjects(mapObjects, imgAssets) {
  mapObjects.push({
    type: 'planet',
    id: 'Dagon',
    img: imgAssets.planetImg2,
    x: 440,
    y: 600,
    population: utils.getRandomInt(4000, 6000),
    banBribes: true,
  });
  mapObjects.push({
    type: 'planet',
    id: 'Hypatia',
    img: imgAssets.planetImg1,
    x: 1300,
    y: 700,
    population: utils.getRandomInt(1000, 2500)
  });
  mapObjects.push({
    type: 'planet',
    id: 'Saffar',
    img: imgAssets.planetImg3,
    x: 2200,
    y: 500,
    population: utils.getRandomInt(5000, 6000)
  });
  mapObjects.push({
    type: 'planet',
    id: 'Draugr',
    img: imgAssets.planetImg4,
    x: 1500,
    y: 1400,
    population: utils.getRandomInt(1000, 2000)
  });
  mapObjects.push({
    type: 'planet',
    id: 'Awasis',
    img: imgAssets.planetImg0,
    x: 2500,
    y: 1700,
    population: utils.getRandomInt(500, 1200)
  });

  // moons
  mapObjects.push({
    type: 'moon',
    subtype: 'basic',
    id: 'Echnia',
    name: utils.getRandomName(),
    orbits: 'Hypatia',
    x: 540,
    y: 200,
    population: 300
  });
  mapObjects.push({
    type: 'moon',
    subtype: 'station-range',
    id: 'Veles',
    name: utils.getRandomName(),
    orbits: 'Saffar',
    x: 540,
    y: 200,
    population: 500
  });
  mapObjects.push({
    type: 'moon',
    subtype: 'station-speed',
    id: 'Neri',
    name: utils.getRandomName(),
    orbits: 'Awasis',
    x: 540,
    y: 200,
    population: 700
  });

  console.assert(mapObjects.filter(o=>o.type === 'planet').length > 1, 'Invalid planet list - too short for source randomization.');

  const planetIDs = mapObjects.filter(o=>o.type === 'planet').map(o=>o.id);
  // remove first planet from draw - for story purposes (no inbound traffic)
  planetIDs.shift();

  for (let i=0; i<15; i++) {
    const targetID = utils.getRandomItem(planetIDs);
    let sourceID;
    do {
      sourceID = utils.getRandomItem(planetIDs);
    } while (targetID === sourceID);
    mapObjects.push({
      type: 'ship',
      id: utils.getNewID(),
      name: utils.getRandomName(),
      // TODO: place around source instead of random
      x: utils.getRandomInt(constants.MAP_WIDTH),
      y: utils.getRandomInt(constants.MAP_HEIGHT),
      population: utils.getRandomInt(1000),
      targetID: targetID,
      sourceID: sourceID
    });
  }
  // TODO: validate map object structures
  console.log('map:', mapObjects);
}

export default {
  loadMapData: generateMapObjects
};
