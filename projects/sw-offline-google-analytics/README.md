# sw-offline-google-analytics

A service worker implementation of the behavior defined in a page's App Cache manifest.

## Installation

`npm install --save-dev sw-offline-google-analytics`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/projects/sw-offline-google-analytics/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-offline-google-analytics/demo/) directly.

## API

### goog.useOfflineGoogleAnalytics

[projects/sw-offline-google-analytics/src/offline-google-analytics-import.js:182-229](https://github.com/GoogleChrome/sw-helpers/blob/213765485d2c3378497e2a80c2b80993a7b09cdf/projects/sw-offline-google-analytics/src/offline-google-analytics-import.js#L182-L229 "Source code on GitHub")

`goog.useOfflineGoogleAnalytics` is the main entry point to the library
from within service worker code.

```js
// Inside your service worker JavaScript, ideally before any other
// 'fetch' event handlers are defined:

// 1) Import the library into the service worker global scope, using
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
importScripts('path/to/offline-google-analytics-import.js');

// 2) Call goog.useOfflineGoogleAnalytics() to activate the library.
goog.useOfflineGoogleAnalytics();

// At this point, implement any other service worker caching strategies
// appropriate for your web app.
```

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 
