import constants from './constants.js';

let container, timeout, emptyTimeout;

const narrations = {
  'start-game': (
    'Good morning, everyone. You\'re listening to Radio Free Earth, I\'m your host %%. ' +
    'Unless you are on Earth right now, we are beaming at you from the Dusty Dodo, ' +
    'the only remaining long-range relay in the galaxy.'
  ),
  'patrol-intercept': (
    'Dear listeners, we are back on air. ' +
    'The kind security officers of %% have towed us into neutral space and confiscated all of our credits. ' +
    'Our crime? Trying to bring you the finest Earthly tunes and news coverage without censorship. ' +
    'Tell your friends to tune in.'
  ),
  'nowhere': (
    'We have just arrived to the middle of nowhere. We saw that there was nothing here, but we still came. ' +
    'Because it\'s about the journey, not the destination... ... This is the signal of Radio Free Earth.'
  )
};
export default {
  init: function(_container) {
    container = _container;
  },
  clearCurrent: function() {
    container.empty();
    clearTimeout(timeout);
    clearTimeout(emptyTimeout);
  },
  show: function(id, param) {
    console.assert(container, 'Missing container - maybe narration module was not initialized?');
    console.assert(narrations[id], 'Unknown narration id: ', id);
    let msg = narrations[id];
    console.assert(msg.split('%%').length <= 1 || param, 'Missing template param for narration id: ', id);

    msg = msg.split('%%').join(param);
    console.log('Narration: ', msg);

    if (timeout) {
      console.warn('Overriding ongoing narration:', container.text());
      clearTimeout(timeout);
    }
    if (emptyTimeout) {
      clearTimeout(emptyTimeout);
    }
    container.empty();

    let i = 0;
    (function _writeChar() {
      // TODO: sound mngmnt
      if (i < msg.length) {
        container.text(container.text() + msg[i]);
        i++;
        timeout = setTimeout(_writeChar, constants.TYPING_CHAR_DELAY);
      } else {
        timeout = null;
        emptyTimeout = setTimeout(() => {
          container.empty();
          emptyTimeout = null;
        }, 4000); // TODO: const
      }
    })();
  }
};
