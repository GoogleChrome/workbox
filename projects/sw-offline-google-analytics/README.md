# sw-offline-google-analytics

A service worker helper library to retry offline Google Analytics requests when a connection is available.

## Installation

`npm install --save-dev sw-offline-google-analytics`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/projects/sw-offline-google-analytics/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-offline-google-analytics/demo/) directly.

## API

### goog.offlineGoogleAnalytics.initialize

[projects/sw-offline-google-analytics/src/offline-google-analytics-import.js:59-99](https://github.com/GoogleChrome/sw-helpers/blob/abc05d9a3763f5db6c6bf650e23f997c7c1eccb2/projects/sw-offline-google-analytics/src/offline-google-analytics-import.js#L59-L99 "Source code on GitHub")

In order to use the library, call`goog.offlineGoogleAnalytics.initialize()`.
It will take care of setting up service worker `fetch` handlers to ensure
that the Google Analytics JavaScript is available offline, and that any
Google Analytics requests made while offline are saved (using `IndexedDB`)
and retried the next time the service worker starts up.

**Parameters**

-   `config` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Optional configuration arguments.
    -   `config.parameterOverrides` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Optional
                         [Measurement Protocol parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters),
                         expressed as key/value pairs, to be added to replayed Google
                         Analytics requests. This can be used to, e.g., set a custom
                         dimension indicating that the request was replayed.

**Examples**

```javascript
// This code should live inside your service worker JavaScript, ideally
// before any other 'fetch' event handlers are defined:

// First, import the library into the service worker global scope:
importScripts('path/to/offline-google-analytics-import.js');

// Then, call goog.offlineGoogleAnalytics.initialize():
goog.offlineGoogleAnalytics.initialize({
  parameterOverrides: {
    // Optionally, pass in an Object with additional parameters that will be
    // included in each replayed request.
    // See https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
    cd1: 'Some Value',
    cd2: 'Some Other Value'
  }
});

// At this point, implement any other service worker caching strategies
// appropriate for your web app.
```

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 
