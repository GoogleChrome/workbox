---
layout: index
title: sw-lib
navigation_weight: 3
---

# sw-lib

Use `sw-lib` to start your journey toward more complicated Workbox use cases.
This module is a high-level library that lets you easily configure a service
worker for precaching assets during install, as well as configure runtime
caching and routing strategies. Use is easy, requiring only importing into your
service worker script, and minimal, straight-forward configuration.


## Install
1. [Install Node.js](https://nodejs.org/en/).
1. Install the module with NPM.

   ```
   npm install --save-dev sw-lib
   ```

1. Copy the following files from
`./node_modules/sw-lib` into your project:

   * sw-lib.js
   * sw-lib.js.map
   * sw-lib.min.js
   * sw-lib.min.js.map

   You can do this with a simple command like:

   ```
   cp node_modules/sw-lib/build/* app/third-party/sw-lib/
   ```

1. To then use `sw-lib` in your service work import the library in your service worker file.

   ```
   importScripts('/third-party/sw-lib/sw-lib.min.js');
   ```

   > Note: If you use a minifier on your service worker script, be aware that
   > Workbox requires one that is ES2015-aware. At the time of Workbox's first
   > release (May 2017)
   > [Babili](https://github.com/babel/babili) is the only minifier that is.

## Precaching

Precaching allows a [Progressive Web App](https://developers.google.com/web/progressive-web-apps/) to store an
[AppShell](https://developers.google.com/web/fundamentals/architecture/app-shell).
An AppShell is the minimal HTML, CSS and JavaScript required to power the user
interface and when cached offline can ensure instant, reliable performance
to users on repeat visits. The sw-lib module implements the precaching needed
for an app shell with the
[goog.swlib.precache(revisionedFiles)](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-lib.SWLib.html#precache)
method. The revisioned files parameter should list all files that your web app
needs at startup. There are two ways to do this, shown in the examples below.

> Note: We recommend that you not create revision numbers
> by hand. Do this automatically using `sw-build` or a
> tool like gulp-rev.

If you revision your URLs already, normally done to
cache bust assets, then you can cache them like so:

```
goog.swlib.cacheRevisionedAssets([
    '/styles/main.1234.css',
    '/images/logo.abcd.jpg'
]);
```

For assets where you can't revision the URLs or file you
can pass in an object with a `url` and `revision`
parameter:

```
goog.swlib.precache([
    {
      url: '/index.html',
      revision: 'b3e78d93b20c49d0c927050682c99df3'
    },
    {
      url: '/about.html',
      revision: 'd2cb0dda3e8313b990e8dcf5e25d2d0f'
    }
]);
```

## Runtime caching

Implementing runtime caching requires matching URLs to
caching strategies. Specify URLs using express
style routes, or regex expressions. For the caching
strategy use a built-in handler or define your own.

To register a caching strategy for a URL, call
`goog.swlib.router.registerRoute(capture, handler)`. This
method takes two parameters:

- *capture*: Specifies which URLs to match.
- *handler*: Returns a resource for the URL using a specific caching strategy.

For example:

```
const stateWhileRevalidate = goog.swlib.staleWhileRevalidate();
goog.swlib.router.registerRoute('/schedule', staleWhileRevalidate);
```

## Specifying URLs

### A single endpoint

The most straight-forward use of an express route resembles a string literal.
This is most useful for endpoints that don't require parameters.

For example, consider a web app for a conference. The
schedule is likely to have a simple URL that doesn't
change. For this URL you might do something like this:

```
const stateWhileRevalidate = goog.swlib.staleWhileRevalidate();
goog.swlib.router.registerRoute('/schedule', staleWhileRevalidate);
```

### A Collection of Similar URLs

Many apps will need to handle URLS which contain
parameters. For example, Reddit's URLs follow the pattern
`/r/<subreddit name>.json`. For example:

```
https://www.reddit.com/r/javascript.json
https://www.reddit.com/r/learnprogramming.json
```

Hard-coding every URL could get tedious. Fortunately, these
URL's can be captured using regular expressions or
express-style routes.

For the Reddit example, you would tokenize the part of the
URL that changes.

Using regular expressions, we could do this like do:

```
goog.swlib.router.registerRoute(/https:\/\/www\.reddit\.com\/r\/\w{1,255}\.json/, staleWhileRevalidate);
```

## Implementing caching strategies

When implementing caching strategies, it's easy to assume
that the best approach is to always get the freshest data
from the network and show the current data while the new
data is being retrieved. In other words, you'll be
attempting to use [stale while revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate). But there are other considerations. Network
constraints and data usage charges may dictate that
network retrieval be used only for the most critical data.
Also third-party API's may have requirements or
constraints on how often and when they can be called.

### Built-in handlers

Built-in handlers make it easy to implement common
runtime-caching strategies. You can
find a complete discussion of caching strategies in
[The Offline Cookbook](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#cache-falling-back-to-network).

For example, imagine an app for passengers of a cruise
ship that contains information about ship's events:
show times, docking schedules, food service hours, that
sort of thing. Obviously the passengers want the most
timely information and this might seem like a good use for
[stale while revalidate](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#stale-while-revalidate). But this is a controlled network
environment and the operators are confident the network
will respond quickly every time. They might chose to use a
[network-first](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-falling-back-to-cache) strategy:

```
const networkFirst = goog.swlib.networkFirst();
var route = /https:\/\/www\.example.com\/jpmedley\/latest.json/;
goog.swlib.router.registerRoute(route, networkFirst);
```

Or, if they're feeling bold enough, a [network-only strategy](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/#network-only).

## Custom Caching Strategies

Using one of the built-in handlers will work for most
applications. If you need more fine-grained control of
the response of a URL you'll need to implement your own caching strategy.

There are two approaches, both shown in examples contained in the api reference. They are [implementing your own handler](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-lib.Router.html#examples) function or [creating a route instance](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-lib.SWLib.html#Route).
