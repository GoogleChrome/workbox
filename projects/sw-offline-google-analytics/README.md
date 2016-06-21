# sw-offline-google-analytics

A service worker implementation of the behavior defined in a page's App Cache manifest.

## Installation

`npm install --save-dev sw-offline-google-analytics`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/projects/sw-offline-google-analytics/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-offline-google-analytics/demo/) directly.

## API

### goog.useOfflineGoogleAnalytics

[projects/sw-offline-google-analytics/src/offline-google-analytics-import.js:134-166](https://github.com/GoogleChrome/sw-helpers/blob/a219fc9188654420fed08c4218c09f9cbc4b6de8/projects/sw-offline-google-analytics/src/offline-google-analytics-import.js#L134-L166 "Source code on GitHub")

`goog.useOfflineGoogleAnalytics` is the main entry point to the library
from within service worker code.

```js
// Inside your service worker JavaScript file:

// Import the library into the service worker global scope:
// https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
importScripts('path/to/offline-google-analytics-import.js');

// Call goog.useOfflineGoogleAnalytics() to set things up.
goog.useOfflineGoogleAnalytics()
```

### replayAnalyticsRequests

[projects/sw-offline-google-analytics/src/offline-google-analytics-import.js:68-115](https://github.com/GoogleChrome/sw-helpers/blob/a219fc9188654420fed08c4218c09f9cbc4b6de8/projects/sw-offline-google-analytics/src/offline-google-analytics-import.js#L68-L115 "Source code on GitHub")

Replays all the queued requests found in IndexedDB, by calling fetch()
with an additional qt= parameter.
