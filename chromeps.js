
var chromeps = (function() {
  
  var callbacks = {};

  //function privateGetActiveTab(callback) {
  //  if (chrome.tabs) {
  //    var tabQuery = {
  //      active: true,
  //      currentWindow: true
  //    };

  //    chrome.tabs.query(tabQuery, function(tabs) {
  //      callback(tabs[0]);
  //    });
  //  }
  //}

  function privateRegisterListener() {
    chrome.runtime.onMessage.addListener(function(message, sender) {
      //console.log("receiving", message);
      // If the message is from a content script and this instance of pubsub is
      // the background script, rebroadcast the message.
      if (chrome.tabs && message.from === 'content_script') {
        // attach the tab id in case the subscriber needs it
        message.content.tabId = sender.tab.id;
        //chrome.tabs.sendMessage(sender.tab.id, message);
        privateSendToAllTabs(message);
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

    chrome.runtime.sendMessage(chromeMsg);
  }

  function privateSendToAllTabs(message) {
    chrome.tabs.query({}, function(tabs) {
      for (var i=0; i<tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, message);
      }
    });
  }

  function sendToContent(filter, message) {
    if (chrome.tabs) {
      chromeMsg = {
        'filter': filter,
        'content': message,
        'from': 'background_page'
      };
      //privateGetActiveTab(function(tab) {
      //  //console.log("sending3", chromeMsg);
      //  chrome.tabs.sendMessage(tab.id, chromeMsg);
      //});
      
      // Publish the message to all tabs
      privateSendToAllTabs(chromeMsg);
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

