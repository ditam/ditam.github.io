
const TYPING_DELAY = 20;
const MSG_LIMIT = 3;

function showMessage(text, sender, immediate) {
  const msg = $('<div></div>').addClass('msg').addClass(sender);
  msgLogArea.append(msg);

  if (sender === 'system') {
    immediate = true;
  }

  if (sender === 'Eva') {
    text = `<Eva>: ${text}`;
  }

  if (immediate) {
    msg.text(text);
  } else {
    msg.text(text[0]);
    let typing = setInterval(() => {
      const currentContent = msg.text();
      if (currentContent === text) {
        clearInterval(typing);
      } else {
        const rest = text.split(currentContent).join('');
        msg.text(currentContent + rest[0]);
      }
    }, TYPING_DELAY);
  }

  applyMsgLimit();
}

// starts fading and removing old messages if msg limit is reached
function applyMsgLimit() {
  if (msgLogArea.find('.msg').length > MSG_LIMIT) {
    const msgToRemove = msgLogArea.find('.msg:not(.fading)').first();
    msgToRemove.addClass('fading');
    msgToRemove.fadeOut(500);
    setTimeout(() => {
      msgToRemove.remove();
    }, 501)
  }
}


function readFromTerminal(terminal, skip) {
  console.assert(terminal.id, 'Wrong terminal structure - no id:', terminal);
  console.assert('readCount' in terminal, 'Wrong terminal structure - no readCount:', terminal);

  const msgs = terminalMessages[terminal.id];

  console.assert(msgs, 'No messages configured for terminal', terminal);

  if (terminal.readCount === 0) {
    // new terminal - clear old messages
    msgLogArea.empty();
  }

  if (msgs.length-1 < terminal.readCount) {
    console.log('Terminal exhausted.');
  } else { // there are messages left
    if (skip) {
      // attempt to skip to end with all effects processed
      let i = 20; // failsafe/max skip
      while((msgs.length-1 >= terminal.readCount) && i) {
        i--;
        const msg = msgs[terminal.readCount];
        showMessage(msg.text, msg.sender, true); // force immediate
        if (typeof msg.effect === 'function') {
          msg.effect();
        }
        terminal.readCount++;
      }
      console.log(`skipped ${20-i} messages.`);
    } else {
      const msg = msgs[terminal.readCount];
      showMessage(msg.text, msg.sender, msg.immediate);
      if (typeof msg.effect === 'function') {
        msg.effect();
      }
      terminal.readCount++;
    }
  }
}

function markObject(id) {
  const targetObject = getObjectFromID(id);
  mapObjects.push({
    type: 'marker',
    x: targetObject.x + 100,
    y: targetObject.y - 20,
    image: curioImage,
  });
}

function removeMarker() {
  // TODO: this currently assumes a single marker
  const i = mapObjects.findIndex(obj => obj.type==='marker');
  if (i>-1) {
    mapObjects.splice(i, 1);
  }
}

function getObjectFromID(id) {
  const i = mapObjects.findIndex(obj => obj.id===id);
  console.assert(i > -1, 'Could not find object with id:', id);
  return mapObjects[i];
}

const terminalMessages = {
  terminal1: [
    {
      sender: 'Eva',
      text: 'Good morning, Dr. Clarke.'
    },
    {
      sender: 'Eva',
      text: 'I apologize for waking you. I am Eva, the onboard navigation AI of this ship.'
    },
    {
      sender: 'player',
      text: 'Where am I?'
    },
    {
      sender: 'Eva',
      text: 'Of course. You are aboard the interstellar cruise ship New Horizons 6. ' +
        'The current Earth date is 2307, the 15th of March. I have woken you from your cryo-sleep due to an emergency.'
    },
    {
      sender: 'player',
      text: 'Why... why me?'
    },
    {
      sender: 'Eva',
      text: 'I was unable to wake any of the senior crew. I\'m afraid our security system is malfunctioning.'
    },
    {
      sender: 'Eva',
      text: 'The hallways are scanned for unauthorized personnel every 10 seconds.'
    },
    {
      sender: 'player',
      text: 'And what happens if I\'m caught outside?'
    },
    {
      sender: 'Eva',
      text: 'Trust me, you do not want to try.'
    },
    {
      sender: 'Eva',
      text: 'I will open your room doors now. Please proceed with caution.',
      effect: function() {
        // reveal 10s timer
        nextPingArea.show();

        // open door
        const doorIndex = mapWalls.findIndex(wall => wall.id==='first-door');
        console.assert(doorIndex > -1, 'Could not find door to open...');
        mapWalls.splice(doorIndex, 1);
        // TODO: play door opening sound
        markObject('terminal2');
        updateFloatingWalls();
      }
    }
  ],
  terminal2: [
    {
      sender: 'player',
      text: 'This is madness.'
    },
    {
      sender: 'Eva',
      text: 'I apologize for the inconvenience, Dr. Clarke.',
      effect: function() {
        removeMarker();
      }
    },
    {
      sender: 'player',
      text: 'These cryo pods are open!'
    },
    {
      sender: 'Eva',
      text: 'I can not explain that. According to my sensors, you are the only passenger awake, doctor. ' +
        'I need your help searching every room of the ship for irregularities. I\'ll open the cockpit doors nearby.'
    },
    {
      sender: 'player',
      text: 'You said the scans are every 10 seconds. It feels a bit longer than that.'
    },
    {
      sender: 'Eva',
      text: 'The scans are scheduled according to Earth time. We are currently travelling at ' +
        '150 000 kilometers a second. You are perceiving the effects of time dilation.',
      effect: function() {
        const doorIndex = mapWalls.findIndex(wall => wall.id==='cockpit-door');
        console.assert(doorIndex > -1, 'Could not find door to open...');
        mapWalls.splice(doorIndex, 1);
        // TODO: play door opening sound
        updateFloatingWalls();
      }
    },
  ],
  terminal3: [
    {
      sender: 'Eva',
      text: 'This is the control room for the radiation shields.'
    },
    {
      sender: 'Eva',
      text: 'If we push them into overdrive, we could reach even higher speeds.'
    },
    {
      sender: 'system',
      text: 'Radiation shields in overdrive.',
      effect: function() {
        shipSpeedLimit = 0.9;
      }
    },
  ]
};
