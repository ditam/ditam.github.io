var PARAMS = Object.freeze({
  COLLECTION_TIME: 1000,
  MAX_COLOR_BIAS: 3,
  MOVE_THRESHOLD: 200,
  MOVE_THRESHOLD_SMALL: 50,
  MOVE_ADJUSTMENT_MULTIPLIER: 2,
  INPUT_WIDTH: 300,
  INPUT_HEIGHT: 250,
  CANVAS_WIDTH: 500,
  CANVAS_HEIGHT: 300,
  PIXEL_SIZE: 5,
  INVADER_COUNT: 7
});
  
document.addEventListener('DOMContentLoaded', function(){

  var runCount = 0;
  var ctx = document.getElementById('fleet-display').getContext('2d');
  var progressButton = document.getElementById('button-progress');
  var clickHandler = function(){ startGeneration(); };
  progressButton.addEventListener('click', clickHandler);

  // Only one half, a 6x8 grid is stored for an invader, because they are 
  // symmetrical to the vertical axis (making their final size 11x8 pixels).
  // The half of the "standard" space invader looks like this:
  //[0,0,1,0,0,0],
  //[0,0,0,1,0,0],
  //[0,0,1,1,1,1],
  //[0,1,1,0,1,1],
  //[1,1,1,1,1,1],
  //[1,0,1,1,1,1],
  //[1,0,1,0,0,0],
  //[0,0,0,1,1,0],
  //but it's not necessary to store this, because the mutators recreate it if there's no mouse input

  var baseInvader = [
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
    [0,0,0,0,0,0],
  ];

  var mutators = [hullMutator, antennaMutator, weaponMutator, thrusterMutator];

  function resetMutators(){
    mutators = [hullMutator, antennaMutator, weaponMutator, thrusterMutator];
  }

  function startGeneration() {
    if(runCount === 0){
      ctx.clearRect(0,0,PARAMS.CANVAS_WIDTH,PARAMS.CANVAS_HEIGHT);
      ctx.fillStyle = 'black';
      ctx.fillRect(0,0,PARAMS.CANVAS_WIDTH,PARAMS.CANVAS_HEIGHT);
    }
    runCount++;
    collectInput(function(inputs){
      // --- add a special random mutator, without a dedicated collection interval
      // it gets the same input as the first mutator
      mutators.push(randomMutator);
      inputs.push(inputs[0]);
      // ----
      var invader = mutateInvader(baseInvader, inputs, mutators);
      display(invader);
    });
  }

  function collectInput(callback){
    var inputArea = document.getElementById('input-area');
    var inputWidth = inputArea.getBoundingClientRect().width; //NB this includes borders
    var inputHeight = inputArea.getBoundingClientRect().height;
    var inputSeed = [];
    var moveCount = 0;
    var firstMove;
    var lastMove;
    var moveCounter = function(event){
      moveCount++;
      var X = event.clientX - this.getBoundingClientRect().left;
      var Y = event.clientY - this.getBoundingClientRect().top;
      if(firstMove){
        lastMove = {x: X, y: Y};
      } else {
        firstMove = {x: X, y: Y};
      }
    };

    inputArea.addEventListener('mousemove', moveCounter);

    progressButton.removeEventListener('click', clickHandler);
    progressButton.innerHTML = 'Generating row... (0/'+mutators.length+')';

    //Dispatch a timeout for each mutator, with increasing delays. Mouse moves are
    // collected between the callbacks, creating the input seed for each mutator.
    mutators.forEach(function(_, i){
      setTimeout(function(){
        progressButton.innerHTML = 'Generating row... ('+(i+1)+'/'+mutators.length+')';
        inputSeed.push({
          moveCount: moveCount,
          firstMove: firstMove,
          lastMove: lastMove
        });
        moveCount = 0;
        firstMove = undefined;
        lastMove = undefined;
        if(i===mutators.length-1){
          inputArea.removeEventListener('mousemove', moveCounter);
          callback(inputSeed);
          progressButton.innerHTML = 'Fleet generated. (Click to restart)';
          resetMutators();
          progressButton.addEventListener('click', clickHandler);
          if(runCount < 3){
            clickHandler();
          } else {
            runCount = 0;
          }
        }
      }, PARAMS.COLLECTION_TIME*(i+1));
    });

  }

  function display(invader){
    var colWidth = (11+3)*PARAMS.PIXEL_SIZE;
    var rowHeight = (8+3)*PARAMS.PIXEL_SIZE;
    for(var i=0;i<PARAMS.INVADER_COUNT;i++){
      for(var row=0;row<2;row++){
        drawInvader(
          ctx,
          2*PARAMS.PIXEL_SIZE+(i*colWidth),
          -(rowHeight)+2*PARAMS.PIXEL_SIZE+(row*rowHeight)+((runCount-1)*2*rowHeight),
          invader
        );
      }
    }
  }

});

function deepCopy(obj){
  return JSON.parse(JSON.stringify(obj));
}

function mutateInvader(base, inputs, mutators){
  var invader = deepCopy(base);
  mutators.forEach(function(mutator, i){
    invader = mutator(invader, inputs[i]);
  });
  return invader;
}

function hullMutator(invader, input){
  var p = { //base pixel
    color: getColorString(input.moveCount)
  };
  var s = deepCopy(p); //secondary pixel
  if(input.firstMove && input.lastMove){
    var x0 = input.firstMove.x;
    var y0 = input.firstMove.y;
    var x1 = input.lastMove.x;
    var y1 = input.lastMove.y;
    if(Math.abs(x0-x1)<100 && Math.abs(y0-y1)<100){
      s.color = getColorString(input.moveCount, 0.8, 0.8, 1)
    }
  }
  var e = 0; //eye pixel
  if(input.firstMove && input.lastMove){
    //only color eyes if movement was downwards - should be rare due to layout
    if(input.firstMove.y < input.lastMove.y ){
      e = {
        color: input.firstMove.x < input.lastMove.x? 'rgb(200,15,15)' : 'rgb(50,175,20)'
      };
    }
  }
  var part = [
    [0,0,0,s], // antenna will overwrite first 3 anyway
    [s,e,s,p],
    [p,s,p,s],
    [s,p,s,p]
  ];
  return applyPart(invader, part, 2, 2);
}

function antennaMutator(invader, input){
  var biasR = 1;
  var biasG = 1;
  var biasB = 1;
  if(input.firstMove && input.lastMove){
    biasR = input.firstMove.x/PARAMS.INPUT_WIDTH;
    biasG = input.firstMove.y/PARAMS.INPUT_HEIGHT;
    biasB = input.lastMove.x/PARAMS.INPUT_WIDTH;
  }
  var p = {
    color: getColorString(input.moveCount, biasR, biasG, biasB)
  };
  var part = [
    [p,0,0,0],
    [0,p,0,0],
    [p,p,p,null]
  ];
  var antenna = [[]];
  //tilt antennae based on movement direction:
  if(input.firstMove && input.lastMove){
    var antenna;
    if( Math.abs(input.firstMove.x-input.lastMove.x)<100 ){
      antenna = [
        [0,p],
        [0,p]
      ];
    } else if (input.firstMove.x < input.lastMove.x){
      antenna = [
        [0,0,p],
        [0,p,0]
      ];
    }
  }
  part = applyPart(part, antenna, 0, 0);
  return applyPart(invader, part, 2, 0);
}

function weaponMutator(invader, input){
  var p = {
    color: getColorString(input.moveCount)
  };
  var part = [
    [0,0],
    [0,0],
    [0,0],
    [0,p],
    [p,p],
    [p,0],
    [p,0],
    [0,0]
  ];
  var weapon = [
    [0,0],
    [0,0],
    [0,0],
    [0,p],
    [p,p]
  ];
  if(input.moveCount > PARAMS.MOVE_THRESHOLD_SMALL){
    weapon = [];
    var binArray = input.moveCount.toString(2).split('');
    //normalize and replace 1s with base pixel
    binArray = binArray.map(function(el){
      return el==='1'? p: 0;
    });
    while(binArray.length > 0) {
      weapon.push(binArray.splice(0,2));
    }
  }
  part = applyPart(part, weapon, 0, 0);
  return applyPart(invader, part, 0, 0);
}

function thrusterMutator(invader, input){
  var biasR = 1;
  var biasG = 1;
  var biasB = 1;
  if(input.lastMove){
    var biasR = Math.min(PARAMS.MAX_COLOR_BIAS/2, input.lastMove.x/input.lastMove.y);
    var biasG = input.lastMove.x > input.lastMove.y? 1: 0;
    var biasB = (input.lastMove.x<20 && input.lastMove.y<20)? 0: 1;
  }
  var p = {
    color: getColorString(input.moveCount, biasR, biasG, biasB)
  };
  var part = [
    [0,0,0,0],
    [0,0,0,0]
  ];
  var thrusters = [
    [p,0,0],
    [0,p,p]
  ];
  if(input.firstMove && input.lastMove){
    if(input.moveCount%3 === 1){
      thrusters = [
        [p,p,p,p],
        [p,0,0,p]
      ];
    } else if(input.moveCount%3 === 2){
      thrusters = [
        [p,p,0,0],
        [0,0,0,0]
      ];
    } else if(input.moveCount > PARAMS.MOVE_THRESHOLD_SMALL){
      thrusters = [
        [p,0,p,0],
        [0,p,0,p]
      ]
    }
  }
  part = applyPart(part, thrusters, 0, 0);
  return applyPart(invader, part, 2, 6);
}

function randomMutator(invader, input){
  var p = {
    color: getColorString(input.moveCount, 0.5, 0.5, 0.5)
  };
  var mutation = [
    [0,0],
    [0,0]
  ];
  if(input.moveCount){
    var _ = (input.moveCount%2)? 0 : null; //50% chance to clear
    switch(input.moveCount%5){
      case 0:
        mutation = [
          [_,p],
          [_,p]
        ];
        break;
      case 1:
        mutation = [
          [_,_],
          [p,p]
        ];
        break;
      case 2:
        mutation = [
          [p,_],
          [_,p]
        ];
        break;
      case 3:
        mutation = [
          [_,p],
          [p,_]
        ];
        break;
      case 4:
        mutation = [
          [_,p],
          [p,p]
        ];
        break;
    }
  }
  // +4 offset ensures that it does not clear anything from the standard invader
  // if there was no input (clears between antennae)
  // The min call ensures that we don't override cells outside of the invader boundary
  var x = Math.min( (input.moveCount+4) % invader[0].length, invader[0].length-mutation[0].length );
  var y = Math.min( (input.moveCount*101) % invader.length, invader.length-mutation.length);
  return applyPart(invader, mutation, x, y);
}

function getColorString(moveCount, biasR, biasG, biasB){
  var n = 256-Math.min(PARAMS.MOVE_THRESHOLD,moveCount*PARAMS.MOVE_ADJUSTMENT_MULTIPLIER);
  var R = 1;
  var G = 1;
  var B = 1;
  if(biasR) R=biasR;
  if(biasG) G=biasG;
  if(biasB) B=biasB;
  //NB: non-integer values are not valid here!
  return 'rgb('+Math.floor(n*R)+','+Math.floor(n*G)+','+Math.floor(n*B)+')';
}

function applyPart(base, part, x, y){
  var invader = deepCopy(base);
  for(var i=0;i<part.length;i++){
    for(var j=0;j<part[i].length;j++){
      if(part[i][j] != null){ // null signals ignore, 0 signals overwrite with empty
        invader[y+i][x+j] = part[i][j];
      }
    }
  }
  return invader;
}

function drawInvader(context, x0, y0, invader){
  for(var y=0;y<invader.length;y++){
    var len = invader[y].length;
    //we're mirroring every column but the last
    for(var x=0;x<len*2-1;x++){ 
      var xPos = x>=len? x-(x-len+1)*2 : x;
      if(invader[y][xPos]){
        context.fillStyle = invader[y][xPos].color;
        context.fillRect(
          x0+x*PARAMS.PIXEL_SIZE,
          y0+y*PARAMS.PIXEL_SIZE,
          PARAMS.PIXEL_SIZE,
          PARAMS.PIXEL_SIZE
        );
      }
    }
  }  
}