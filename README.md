Simple pubsub implementation for Chrome extensions, with a few extra features.

Messages are propagated to every part of your extension (by default), no matter where they originate from.

This module was created to address 2 fundamental challenges with writing Chrome extensions:

# Purpose

1. Handling lots of message passing cleanly.
2. Passing messages between a content script and iframes

The second point is the most interesting. If you have an iframe as part of your content script, it cannot communicate directly with the rest of your content script, so you end up having to go through the background page. This gets messy real fast. chromeps provides a clean abstraction over this process, using a generic pubsub interface.

# Installation

Copy chromeps.js into your project directory

# Usage
You need to include chromeps.js in your background page as well as any content scripts or iframes that load up.

## Load chromeps.js
If all your code is in Javascript files all you need to do is edit your `manifest.json` as such:

```
{
  ...
  "background" : {
    "scripts" : [
      "chromeps.js",
      "background.js"
    ]
  },
  "content_scripts" : [
    {
      "js" : [
        "chromeps.js",
        "content.js"
      ]
    }
  ]
  ...
}
```

Where `background.js` is your background page and `content.js` is one of your content scripts. So basically chromeps will be loaded for the background page and each of your content scripts.

## Subscribe to Messages

```javascript
chromeps.subscribe('mytopic', function(message) {
    // do something
}
```
## Publish Messages
```javascript
chromeps.publish('mytopic', {'content': 'Hi there'});
```

You can use an Javascript objects or strings as messages. By default, messages are propagated to the background page and every tab. See below for cusumization options.

## Extras
There are a few extra features to help in using chromeps

### Control where messages are sent
Often times you don't need your messages to be sent to every tab, and it's more efficient to avoid blasting all your tabs with messages. You can customize where messages are sent using the following methods:

```
chromeps.publishActive('mytopic', 'hi there'); // only publishes to active tab
chromeps.publishSame('mytopic', 'hi there'); // only publishes to this tab
```

For example if you publish a message from a content script on a tab using `publishSame`, only content scripts and iframe on that tab will see the messages.

### Determine tab ID
Often it is very useful to filter received messages on the subscriber side, so we know whether the message affects the tab that receives it. Unfortunately the only way for a tab to identify itself is to ask the background page. The `getTabId` method provides this functionality transparently. It only makes the request the first time then saves the value for future queries. However, since the first request is asynchronous the return value is retrieved via a callback.

```
chromeps.getTabId(function(tabId) {
  // tabId ready
});
```
