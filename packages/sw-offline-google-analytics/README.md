# sw-offline-google-analytics

A service worker helper library to retry offline Google Analytics requests when a connection is available.

## Installation

`npm install --save-dev sw-offline-google-analytics`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-offline-google-analytics/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-offline-google-analytics/demo/) directly.

## API

### goog.offlineGoogleAnalytics.initialize

[packages/sw-offline-google-analytics/src/index.js:82-132](https://github.com/GoogleChrome/sw-helpers/blob/6618776516d4738d9626f115ff44d643ede71903/packages/sw-offline-google-analytics/src/index.js#L82-L132 "Source code on GitHub")

In order to use the library, call`goog.offlineGoogleAnalytics.initialize()`.
It will take care of setting up service worker `fetch` handlers to ensure
that the Google Analytics JavaScript is available offline, and that any
Google Analytics requests made while offline are saved (using `IndexedDB`)
and retried the next time the service worker starts up.

**Parameters**

-   `config` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Optional configuration arguments.
    -   `config.parameterOverrides` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** Optional
                           [Measurement Protocol parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters),
                           expressed as key/value pairs, to be added to replayed
                           Google Analytics requests. This can be used to, e.g., set
                           a custom dimension indicating that the request was
                           replayed.
    -   `config.hitFilter` **\[[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)]** Optional
                           A function that allows you to modify the hit parameters
                           prior to replaying the hit. The function is invoked with
                           the original hit's URLSearchParams object as its only
                           argument. To abort the hit and prevent it from being
                           replayed, throw an error.

**Examples**

```javascript
// This code should live inside your service worker JavaScript, ideally
// before any other 'fetch' event handlers are defined:

// First, import the library into the service worker global scope:
importScripts('path/to/offline-google-analytics-import.js');

// Then, call goog.offlineGoogleAnalytics.initialize():
goog.offlineGoogleAnalytics.initialize();

// At this point, implement any other service worker caching strategies
// appropriate for your web app.
```

```javascript
// If you need to specify parameters to be sent with each hit, you can use
// the `parameterOverrides` configuration option. This is useful in cases
// where you want to set a custom dimension on all hits sent by the service
// worker to differentiate them in your reports later.
goog.offlineGoogleAnalytics.initialize({
  parameterOverrides: {
    cd1: 'replay'
  }
});
```

```javascript
// In situations where you need to programmatically modify a hit's
// parameters you can use the `hitFilter` option. One example of when this
// might be useful is if you wanted to track the amount of time that elapsed
// between when the hit was attempted and when it was successfully replayed.
goog.offlineGoogleAnalytics.initialize({
  hitFilter: searchParams =>
    // Sets the `qt` param as a custom metric.
    const qt = searchParams.get('qt');
    searchParams.set('cm1', qt);
  }
});
```

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)**
