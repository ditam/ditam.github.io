game.utils = {

  avg: function(array) {
    if (!array.length) return 0;
    let sum = 0;
    array.forEach(x => sum+=x);
    return sum/array.length;
  },

  discoverObjectsInRange: function(x, y, objects) {
    // TODO: use viewport or some space partitioning to make this more performant? Will do for now...
    objects.forEach(function(obj) {
      if (obj.isHidden && game.utils.dist(x, y, obj.x, obj.y) < OBJECT_DISCOVERY_RANGE) {
        if (obj.forceHide) return; // such objects need explicit reveal
        game.utils.fadeInObject(obj);
      }
    });
  },

  dist: function(x0, y0, x1, y1) {
    return Math.sqrt(
      (x0-x1)*(x0-x1) + (y0-y1)*(y0-y1)
    );
  },

  fadeInObject: function(obj) {
    if (!obj.isHidden) {
      console.warn('Object is already displayed or fading in:', obj);
      return;
    }

    obj.isHidden = false;
    delete obj.forceHide;
    obj.isFadingIn = true;
    obj.fadeCounter = 0;
  },

  fadeOutObject: function(obj) {
    if (obj.isFadingOut) {
      console.warn('Object is already fading out:', obj);
      return;
    }

    obj.isFadingOut = true;
    obj.fadeCounter = 0;
  },

  swapObjects: function(idA, idB) {
    const objA = game.utils.findObjectByID(idA, game.state.objects);
    game.utils.fadeOutObject(objA);
    const objB = game.utils.findObjectByID(idB, game.state.objects);
    game.utils.fadeInObject(objB);
  },

  isObjectInProximity: function(playerCoords, objectCoords) {
    const xDist = Math.abs(playerCoords.x - objectCoords.x);
    const yDist = Math.abs(playerCoords.y - objectCoords.y);

    const distSquared = xDist*xDist + yDist*yDist;
    return distSquared < ACTIVITY_RADIUS*ACTIVITY_RADIUS;
  },

  findObjectByID: function(id, objects) {
    return objects.filter(o => o.id === id)[0];
  }
};
