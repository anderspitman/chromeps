
var chromeps = (function() {
  
  var callbacks = {};

  function privateSendToTabs(message) {
    chrome.tabs.query({}, function(tabs) {
      for (var i=0; i<tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, message);
      }
    });
  }

  function privateRegisterListener() {
    chrome.runtime.onMessage.addListener(function(message, sender) {
      // If the message is from a content script and this instance of pubsub is
      // the background script, rebroadcast the message.
      if (chrome.tabs && message.from === 'content_script') {
        // attach the tab id in case the subscriber needs it
        message.content.tabId = sender.tab.id;
        privateSendToTabs(message);
      }

      if (callbacks[message.filter]) {
        for (var i=0; i<callbacks[message.filter].length; i+=1) {
          callbacks[message.filter][i](message.content);
        }
      }

    });
  }

  function publicPublish(filter, message) {
    chromeMsg = {
      'filter': filter,
      'content': message
    };

    // If sending from the background page, send directly to the tabs. If
    // sending from a content script, we need to send it to the background
    // script, which will re-broadcast it out to the tabs.
    if (chrome.tabs) {
      chromeMsg.from = 'background_page';
      privateSendToTabs(chromeMsg);
    }
    else {
      chromeMsg.from = 'content_script';
    }

    chrome.runtime.sendMessage(chromeMsg);
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

