const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

game.ui = {
  updateToolbar: function() {
    $('.toolbar').empty();
    const resources = game.utils.clone(game.state.resources);
    let sHTML = '<span class="resources">';
    ['carb', 'stem', 'water'].forEach(function(resName) {
      sHTML += '<span class="resource ' + resName + '">' + resources[resName] + '</span>';
    });
    sHTML += '</span>'

    // TODO: remove or hide behind debug flag, this will not be here, just drawn
    //sHTML += ', leaves:' + game.state.tree.leaves;
    //sHTML += ', branches:' + game.state.tree.branches;
    //sHTML += ', trunk:' + game.state.tree.trunkSize;

    sHTML += '<span class="calendar">Year ' + game.state.year;
    sHTML += ', ' + months[game.state.month] + '</span>';
    $('.toolbar').html(sHTML);
  }
};
