game.utils = {
  clone: function(a) {
    return JSON.parse(JSON.stringify(a));
  },
  getCoords: function(canvas, mouseEvent) {
    const rect = canvas[0].getBoundingClientRect();
    const x = mouseEvent.clientX - rect.left;
    const y = mouseEvent.clientY - rect.top;
    return {x: x, y: y};
  },
  // NB: returns a live reference, so it can be used for updates
  getUpgradeByID: function(id) {
    let upgrade;
    ['branches', 'trunk', 'roots'].forEach(function(scene) {
      game.upgrades[scene].items.forEach(function(u) {
        if (u.id === id) {
          upgrade = u;
        }
      });
    });
    return upgrade;
  },
};
