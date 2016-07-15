# sw-offline-google-analytics

A library to extend a service worker's behavior, allowing it to retry failed Google Analytics requests.

## Installation

`npm install --save-dev sw-offline-google-analytics`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/projects/sw-offline-google-analytics/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-offline-google-analytics/demo/) directly.

## API

### goog.useOfflineGoogleAnalytics

[projects/sw-offline-google-analytics/src/offline-google-analytics-import.js:45-83](https://github.com/GoogleChrome/sw-helpers/blob/5320c8269f3368939bf792c4bc1a47487ca7963f/projects/sw-offline-google-analytics/src/offline-google-analytics-import.js#L45-L83 "Source code on GitHub")

In order to use the library, call`goog.useOfflineGoogleAnalytics()`.
It will take care of setting up service worker `fetch` handlers to ensure
that the Google Analytics JavaScript is available offline, and that any
Google Analytics requests made while offline are saved (using `IndexedDB`)
and retried the next time the service worker starts up.

**Examples**

```javascript
// This code should live inside your service worker JavaScript, ideally
// before any other 'fetch' event handlers are defined:

// First, import the library into the service worker global scope:
importScripts('path/to/offline-google-analytics-import.js');

// Then, call goog.useOfflineGoogleAnalytics() to activate the library.:
goog.useOfflineGoogleAnalytics();

// At this point, implement any other service worker caching strategies
// appropriate for your web app.
```

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 
