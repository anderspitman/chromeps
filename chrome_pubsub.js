
var pubsub = (function() {
  
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
    chrome.runtime.onMessage.addListener(function(message) {
      console.log("receiving", message);
      if (callbacks[message.filter]) {
        for (var i=0; i<callbacks[message.filter].length; i+=1) {
          callbacks[message.filter][i](message.content);
        }
      }

      // If the message is from a content script and this instance of pubsub is
      // the background script, rebroadcast the message out to all content
      // scripts
      if (message.from === 'content_script') {
        privateGetActiveTab(function(tab) {
          chrome.tabs.sendMessage(tab.id, message);
        });
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

    console.log("sending", chromeMsg);
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
        console.log("sending", chromeMsg);
        chrome.tabs.sendMessage(tab.id, chromeMsg);
      });
    }
  }

  function publicPublish(filter, message) {
    sendToBackground(filter, message);
    sendToContent(filter, message);
  }

  function publicSubscribe(filter, callback) {
    console.log(callbacks[filter]);
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

