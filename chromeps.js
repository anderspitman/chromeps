
var chromeps = (function() {
  
  var callbacks = {};

  function privateGetActiveTab(callback) {
    if (chrome.tabs) {
      var tabQuery = {
        active: true,
        currentWindow: true
      };

      chrome.tabs.query(tabQuery, function(tabs) {
        callback(tabs[0]);
      });
    }
  }

  function privateRegisterListener() {
    chrome.runtime.onMessage.addListener(function(message, sender) {
      //console.log("receiving", message);
      // If the message is from a content script and this instance of pubsub is
      // the background script, rebroadcast the message.
      // TODO: this currently assumes the active tab is the only one we're
      // interested in. It would be nice to have a mechanism to broadcast to
      // all tabs, with each tab filtering out messages not meant for it.
      if (chrome.tabs && message.from === 'content_script') {
        // attach the tab id in case the subscriber needs it
        message.content.tabId = sender.tab.id;
        //console.log("sending1", message);
        chrome.tabs.sendMessage(sender.tab.id, message);
      }

      if (callbacks[message.filter]) {
        for (var i=0; i<callbacks[message.filter].length; i+=1) {
          callbacks[message.filter][i](message.content);
        }
      }

    });
  }

  function sendToBackground(filter, message) {
    chromeMsg = {
      'filter': filter,
      'content': message
    };

    if (chrome.tabs) {
      chromeMsg.from = 'background_page';
    }
    else {
      chromeMsg.from = 'content_script';
    }

    //console.log("sending2", chromeMsg);
    chrome.runtime.sendMessage(chromeMsg);
  }

  function sendToContent(filter, message) {
    if (chrome.tabs) {
      chromeMsg = {
        'filter': filter,
        'content': message,
        'from': 'background_page'
      };
      privateGetActiveTab(function(tab) {
        //console.log("sending3", chromeMsg);
        chrome.tabs.sendMessage(tab.id, chromeMsg);
      });
    }
  }

  function publicPublish(filter, message) {
    sendToBackground(filter, message);
    sendToContent(filter, message);
  }

  function publicSubscribe(filter, callback) {
    if (callbacks[filter] === undefined) {
      callbacks[filter] = [];
    }
    callbacks[filter].push(callback);
  }

  privateRegisterListener();

  return {
    publish: publicPublish,
    subscribe: publicSubscribe
  }

}());

