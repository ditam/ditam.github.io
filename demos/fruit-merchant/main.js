// util to get a jquery-like position object from a DOM area object
function getAreaPosition(area) {
  const coordsAttr = area.attr('coords');
  const coords = coordsAttr.split(',');
  return {
    top: parseInt(coords[1],10),
    left: parseInt(coords[0],10)
  };
}

function getRandomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function renderInventory(products, inventory, currentMoney) {
  const inventoryTable = $('#inventory');
  inventoryTable.empty();
  const headerRow = $('<tr>');
  const valuesRow = $('<tr>');
  for (let i=0; i<products.length; i++) {
    const icon = $('<img>').attr('src', 'assets/icons/' + products[i].icon + '.png').css('width', '16px').css('height', '16px');
    headerRow.append($('<th>').append(icon));
    valuesRow.append($('<td>').text(inventory[i]));
  }
  inventoryTable.append(headerRow);
  inventoryTable.append(valuesRow);

  $('#money-container #counter').text(currentMoney);
}

function renderPricesTable(towns, products, prices) {
  const table = $('#prices-container table');
  table.empty();
  
  // add header row
  const headerRow = $('<tr>');
  headerRow.append($('<th>'));
  for (let i=0;i<products.length;i++) {
    const label = $('<div>').text(products[i].name);
    label.css('background-image', 'url(assets/icons/' + products[i].icon + '.png)');
    label.css('background-repeat', 'no-repeat');
    label.css('background-size', '16px');
    label.css('background-position', '0');
    label.css('padding-left', '25px');
    label.css('margin-left', '-10px');
    
    const headerCell = $('<th>').append(label);
    headerRow.append(headerCell);
  }
  table.append(headerRow);
  
  // generate town rows
  for (name in towns) {
    const row = $('<tr>');
    row.append($('<td>').text(name));
    for (let i=0;i<prices[name].length;i++) {
      const cell = $('<td>').text(prices[name][i]);
      row.append(cell);
    }
    table.append(row);
  }
}

function renderTradeDialog(townName, town, products, pricesInTown) {
  const container = $('#trade-container');
  container.empty();
  
  const icon = $('<img>').attr('src', 'assets/icons/town' + town.type + '.png');
  container.append(icon);
  
  const title = $('<div>').text('Welcome to ');
  container.append(title);
  const nameLabel = $('<div>').text(townName).addClass('town-name');
  container.append(nameLabel);
  
  const table = $('<table>');
  const header = $('<tr><th></th><th>Available</th><th>Price</th><th>Sell</th><th>Buy</th></tr>');
  table.append(header);
  
  // generate rows for fruits
  for (let i=0; i<products.length; i++) {
    const row = $('<tr>');
    const icon = $('<img>').attr('src', 'assets/icons/' + products[i].icon + '.png').css('width', '16px').css('height', '16px');
    row.append($('<td>').append(icon));
    row.append($('<td>').text(town.stockpiles[i]));
    row.append($('<td>').text(pricesInTown[i]));
    row.append($('<td>').append($('<button>').addClass('sell').text('-1').data('index', i)));
    row.append($('<td>').append($('<button>').addClass('buy').text('+1').data('index', i)));
    table.append(row);
  }
  
  container.append(table);

  const footer = $('<div>').addClass('footer').text('Leave town');
  container.append(footer);
}

function showMessage(text, secondary) {
  const container = $('#message-container');
  container.empty();
  container.append($('<div>').addClass('content').text(text));
  if (secondary) {
    container.append($('<div>').addClass('content secondary').text(secondary));
  }
  container.append($('<div>').addClass('hint').text('Click to dismiss'));
  container.addClass('visible');
}

function rot(inventory, products, distance) {
  for (let i=0; i<inventory.length; i++) {
    product = products[i];
    if (product.rots) {
      const rotFactor = distance/product.timeToRot;
      const rotCount = Math.ceil(rotFactor*inventory[i]);
      inventory[i] -= rotCount;
      inventory[i+1] += rotCount;
    }
  }
}

function increaseStockpiles(towns, products, prices) {
  for (name in towns) {
    const town = towns[name];
    for (let i=0; i<products.length; i++) {
      if (Math.random() > 0.1) {
        town.stockpiles[i] += 2;
        prices[name][i] = getRandomIntFromInterval(products[i].minPrice, products[i].maxPrice);
      }
    }
  }
}

function checkVictory(inventory, money) {
  if (
    inventory.every(function(val) {
      return val>0;
    })
    &&
    money >= 1000
  ) {
    showMessage('Congratulations, you are victorious!');
  }
}

$(function() {
  // initialize audio assets
  const bgMusic = new Audio('assets/audio/music.mp3');
  const moneySound =  new Audio('assets/audio/money.mp3')
  
  // set bg music to loop
  bgMusic.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false);
  
  // shared state and references
  let soundsOn = false;
  const player = $('#player');
  let money = 0;
  const inventory = [0,0,0,0,0,0,0,0,0,0,0,0];
  const inventory_size = 5;
  function inventoryIsFull() { return inventory.reduce(function(sum, v) {return sum+v;}, 0) >= inventory_size }
  let currentTown = 'Edgemoor';
  
  const towns = {
    Edgemoor: {
      distance: 0,
      type: 1,
      stockpiles: [10,10,10,5,5,5,0,0,0,0,0,0]
    },
    Lorvale: {
      distance: 0,
      type: 1,
      stockpiles: [10,10,0,0,0,0,1,0,0,1,0,0]
    },
    Wildeash: {
      distance: 0,
      type: 1,
      stockpiles: [0,0,20,20,0,5,0,5,0,2,0,1]
    },
    Cliffholt: {
      distance: 1,
      type: 2,
      stockpiles: [50,0,50,0,10,2,0,2,1,5,0,10]
    },
    Janton: {
      distance: 1,
      type: 2,
      stockpiles: [80,10,70,50,0,50,0,3,0,3,0,3]
    },
    Blelridge: {
      distance: 1,
      type: 2,
      stockpiles: [10,10,10,50,0,20,2,2,2,1,0,0]
    },
    Sagewynne: {
      distance: 2,
      type: 3,
      stockpiles: [20,0,20,0,20,0,10,0,10,0,5,0]
    },
    Ostmont: {
      distance: 2,
      type: 3,
      stockpiles: [50,0,50,0,50,0,10,0,10,0,10,0]
    }
  };
  
  const products = [
    {
      name: 'apples',
      icon: 'apple',
      rots: true,
      timeToRot: 8,
      minPrice: 1,
      maxPrice: 5
    },
    {
      name: 'apples (bruised)',
      icon: 'apple_rot',
      minPrice: 0,
      maxPrice: 2
    },
    {
      name: 'pears',
      icon: 'pear',
      rots: true,
      timeToRot: 7,
      minPrice: 2,
      maxPrice: 5
    },
    {
      name: 'pears (bruised)',
      icon: 'pear_rot',
      minPrice: 0,
      maxPrice: 3
    },
    {
      name: 'plums',
      icon: 'plum',
      rots: true,
      timeToRot: 5,
      minPrice: 2,
      maxPrice: 7
    },
    {
      name: 'plums (rotten)',
      icon: 'plum_rot',
      minPrice: 1,
      maxPrice: 5
    },
    {
      name: 'bananas',
      icon: 'banana',
      rots: true,
      timeToRot: 4,
      minPrice: 5,
      maxPrice: 20
    },
    {
      name: 'bananas (bruised)',
      icon: 'banana_rot',
      minPrice: 1,
      maxPrice: 8
    },
    {
      name: 'oranges',
      icon: 'orange',
      rots: true,
      timeToRot: 3,
      minPrice: 15,
      maxPrice: 40
    },
    {
      name: 'oranges (bruised)',
      icon: 'orange_rot',
      minPrice: 5,
      maxPrice: 10
    },
    {
      name: 'grapes',
      icon: 'grapes',
      rots: true,
      timeToRot: 2,
      minPrice: 40,
      maxPrice: 99
    },
    {
      name: 'grapes (rotten)',
      icon: 'grapes_rot',
      minPrice: 5,
      maxPrice: 50
    },
  ];
  
  const prices = {
    // prices are listed in order 1a, 1b, 2a, 2b etc
    Edgemoor:  [2,1,3,1,4,2,10,4,20,8,40,20],
    Lorvale:   [2,0,3,1,4,2,10,4,20,8,45,20],
    Wildeash:  [3,1,4,1,5,3,10,4,20,8,40,20],
    Cliffholt: [3,1,4,1,5,2,10,4,20,8,50,20],
    Janton:    [3,1,5,2,5,2,10,4,20,8,50,20],
    Blelridge: [3,1,5,1,5,2,10,4,20,8,60,30],
    Sagewynne: [2,0,3,1,4,2,10,4,20,8,65,20],
    Ostmont:   [2,0,3,1,4,2,10,4,20,8,70,20]
  };
  
  // render initial inventory and prices table
  renderInventory(products, inventory, money);
  renderPricesTable(towns, products, prices);
  
  // connect event handlers
  $('area').click(function() {
    const town = $(this);
    const prevTown = currentTown;
    currentTown = town.data('name');
    // hide trade dialog if open
    $('#trade-container').removeClass('visible');
    // move the player marker for feedback
    player.css('top', getAreaPosition(town).top);
    player.css('left', getAreaPosition(town).left);
    // rot inventory according to distance travelled
    rot(inventory, products, Math.abs(towns[prevTown].distance - towns[currentTown].distance));
    renderInventory(products, inventory, money);
    increaseStockpiles(towns, products, prices);
    renderPricesTable(towns, products, prices);
  });
  
  $('#prices-button').click(function() {
    $('#prices-container').toggleClass('visible');
  });
  
  $('#mute-button').click(function() {
    soundsOn = !soundsOn;
    if (soundsOn) {
      $('#mute-button img').attr('src', 'assets/icons/sound.png');
      bgMusic.play();
    } else {
      $('#mute-button img').attr('src', 'assets/icons/sound-muted.png');
      bgMusic.pause();
    }
  });
  
  // Bring up trade dialog when player is clicked
  player.click(function() {
    renderTradeDialog(currentTown, towns[currentTown], products, prices[currentTown]);
    $('#trade-container').addClass('visible');
  });
  
  // Connect delegated handlers for buy and sell actions
  $('#trade-container').on('click', 'button.sell', function() {
    const productIndex = $(this).data('index');
    const price = prices[currentTown][productIndex];
    if (inventory[productIndex] < 1) {
      showMessage('0 units - can not sell.');
      return;
    }
    inventory[productIndex] -= 1;
    towns[currentTown].stockpiles[productIndex] -= 1;
    money += price;
    if (soundsOn) {
      moneySound.play();
    }
    renderInventory(products, inventory, money);
    renderTradeDialog(currentTown, towns[currentTown], products, prices[currentTown]);
    checkVictory(inventory, money);
  });
  $('#trade-container').on('click', 'button.buy', function() {
    const productIndex = $(this).data('index');
    const price = prices[currentTown][productIndex];
    // TODO: re-add inventory with travel methods
    //if (inventoryIsFull()) {
    //  showMessage('Inventory is full - can not buy.');
    //  return;
    //}
    if (money < price) {
      showMessage('You don\'t have enough money to buy.');
      return;
    }
    if (towns[currentTown].stockpiles[productIndex] <= 0) {
      showMessage('0 units in town - can not buy.');
      return;
    }
    inventory[productIndex] += 1;
    towns[currentTown].stockpiles[productIndex] -= 1;
    money -= price;
    if (soundsOn) {
      moneySound.play();
    }
    renderInventory(products, inventory, money);
    renderTradeDialog(currentTown, towns[currentTown], products, prices[currentTown]);
    checkVictory(inventory, money);
  });
  
  // Hide dialogs on clicking
  $('#prices-container').click(function() {
    $('#prices-container').removeClass('visible');
  });
  $('#message-container').click(function() {
    $('#message-container').removeClass('visible');
  });
  $('#trade-container').on('click', '.footer', function() {
    $('#trade-container').removeClass('visible');
  });
  
  // display opening message
  showMessage('Welcome! I heard you want to become a trader, but you don\'t have any money or anything to sell! Well... good luck, kiddo! I hear in Lorevale they are throwing away rotten apples, maybe you can become a rotten apple salesman! Ha-ha.', 'When in town, click on your banner to trade.');
});
