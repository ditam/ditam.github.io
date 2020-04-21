game._state = game.utils.clone(game.state);
game._upgrades = game.utils.clone(game.upgrades);

game.resetState = function() {
  game.state = game.utils.clone(game._state);
  game.upgrades = game.utils.clone(game._upgrades);
  game.animationTimer = 0;

  game.ui.updateToolbar();

  $('.wrapper .tabs').removeClass('game-over');
  $('.wrapper .tabs .tab').removeClass('selected');
  $('.wrapper .tabs .tab').first().addClass('selected');
  $('#game-over-modal').addClass('hidden');
  game.drawScene();
};
