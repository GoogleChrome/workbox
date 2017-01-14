# sw-routing

A service worker helper library to route request URLs to handlers.

## Installation

`npm install --save-dev sw-routing`

## Demo

Browse sample source code in the [demo directory](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-routing/demo), or
[try it out](https://googlechrome.github.io/sw-helpers/sw-routing/demo/) directly.

## API

### sw-routing

[packages/sw-routing/src/index.js:21-21](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/index.js#L21-L21 "Source code on GitHub")

sw-routing Module

### defaultMethod

[packages/sw-routing/src/lib/constants.js:23-23](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/constants.js#L23-L23 "Source code on GitHub")

The default HTTP method, 'GET', used when there's no specific method
configured for a route.

### validMethods

[packages/sw-routing/src/lib/constants.js:31-37](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/constants.js#L31-L37 "Source code on GitHub")

The list of valid HTTP methods associated with requests that could be routed.

### ExpressRoute

[packages/sw-routing/src/lib/express-route.js:54-95](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/express-route.js#L54-L95 "Source code on GitHub")

**Extends Route**

`ExpressRoute` is a helper class to make defining Express-style
[Routes][Route](#route) easy.

Under the hood, it uses the [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp)
library to transform the `path` parameter into a regular expression, which is
then matched against the URL's path.

Please note that `ExpressRoute` can only match requests for URLs that are on
the same-origin as the current page. If you need to match cross-origin
requests, you can use either a generic [`Route`][Route](#route) or a
[`RegExpRoute`][RegExpRoute](#regexproute).

**Examples**

```javascript
// Any same-origin requests that start with /path/to and ends with one
// additional path segment will match this route, with the last path
// segment passed along to the handler via params.file.
const route = new goog.routing.ExpressRoute({
  path: '/path/to/:file',
  handler: {
    handle: ({event, params}) => {
      // params.file will be set based on the request URL that matched.
      // Do something that returns a Promise.<Response>, like:
      return caches.match(event.request);
    },
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### RegExpRoute

[packages/sw-routing/src/lib/regexp-route.js:47-76](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/regexp-route.js#L47-L76 "Source code on GitHub")

**Extends Route**

RegExpRoute is a helper class to make defining regular expression based
[Routes][Route](#route) easy.

`RegExpRoute` performs its matches against the full request URL, including
the origin. This means that, unlike [`ExpressRoute`][ExpressRoute](#expressroute),
it's able to match cross-origin requests.

**Examples**

```javascript
// Any requests that match the regular expression will match this route, with
// the capture groups passed along to the handler as an array via params.
const route = new goog.routing.RegExpRoute({
  regExp: new RegExp('^https://example.com/path/to/(\\w+)'),
  handler: {
    handle: ({event, params}) => {
      // params[0], etc. will be set based on the regexp capture groups.
      // Do something that returns a Promise.<Response>, like:
      return caches.match(event.request);
    },
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### Route

[packages/sw-routing/src/lib/route.js:64-92](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/route.js#L64-L92 "Source code on GitHub")

A `Route` allows you to tell a service worker that it should handle
certain network requests using a specific response strategy.

Two configuration options are required:

-   A `match` function, which examines
    an incoming [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
    to determine whether this `Route` should apply. The function should return
    a [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) value
    if the `Route` matches, in which case that return value is passed along to
    the `handle` function.
-   A `handler` object, which should in turn have a function defined on it
    named `handle`. This `handle` function is given the incoming request along
    with any additional parameters generated during the `match`, and returns a
    Promise for a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

Instead of implementing your own `handler`, you can use one of the
pre-defined runtime caching strategies from the `sw-runtime-caching` module.

While you can use `Route` directly, the [`RegExpRoute`][RegExpRoute](#regexproute)
and [`ExpressRoute`][ExpressRoute](#expressroute) subclasses provide a convenient
wrapper with a nicer interface for using regular expressions or Express-style
routes as the `match` criteria.

**Examples**

```javascript
// Any navigation requests for URLs that start with /path/to/ will match.
const route = new goog.routing.Route({
  match: ({url, event}) => {
    return event.request.mode === 'navigation' &&
           url.pathname.startsWith('/path/to/');
  },
  handler: {
    handle: ({event}) => {
      // Do something that returns a Promise.<Response>, like:
      return caches.match(event.request);
    },
  },
});

const router = new goog.routing.Router();
router.registerRoute({route});
```

### Router

[packages/sw-routing/src/lib/router.js:50-148](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/router.js#L50-L148 "Source code on GitHub")

The Router takes one or more [Routes][Route](#route) and registers a [`fetch`
event listener](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent)
that will respond to network requests if there's a matching route.

It also allows you to define a "default" handler that applies to any requests
that don't explicitly match a `Route`, and a "catch" handler that responds
to any requests that throw an exception while being routed.

**Examples**

```javascript
// The following example sets up two routes, one to match requests with
// "assets" in their URL, and the other for requests with "images", along
// with different runtime caching handlers for each.
// Both the routes are registered with the router, and any requests that
// don't match either route will be handled using the default NetworkFirst
// strategy.
const assetRoute = new RegExpRoute({
  regExp: /assets/,
  handler: new goog.runtimeCaching.StaleWhileRevalidate(),
});
const imageRoute = new RegExpRoute({
  regExp: /images/,
  handler: new goog.runtimeCaching.CacheFirst(),
});

const router = new goog.routing.Router();
router.registerRoutes({routes: [assetRoute, imageRoute]});
router.setDefaultHandler({handler: new goog.runtimeCaching.NetworkFirst()});
```

### constructor

[packages/sw-routing/src/lib/express-route.js:65-94](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/express-route.js#L65-L94 "Source code on GitHub")

**Parameters**

-   `path` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The path to use for routing.
           If the path contains [named parameters](https://github.com/pillarjs/path-to-regexp#named-parameters),
           then an Object mapping the names of parameter to the corresponding value
           will be passed to the handler via `params`.
-   `handler` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An Object with a `handle` method. That method
           will be used to respond to matching requests.
-   `method` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Only match requests that use this
           HTTP method. Defaults to `'GET'` if not specified.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.path`  
    -   `$0.handler`  
    -   `$0.method`  

### constructor

[packages/sw-routing/src/lib/regexp-route.js:57-75](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/regexp-route.js#L57-L75 "Source code on GitHub")

**Parameters**

-   `regExp` **[RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)** The regular expression to match against URLs.
           If the `RegExp` contains [capture groups](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#grouping-back-references),
           then the array of captured values will be passed to the handler via
           `params`.
-   `handler` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** The handler to manage the response.
-   `method` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Only match requests that use this
           HTTP method. Defaults to `'GET'` if not specified.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `$0.regExp`  
    -   `$0.handler`  
    -   `$0.method`  

### constructor

[packages/sw-routing/src/lib/route.js:79-91](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/route.js#L79-L91 "Source code on GitHub")

**Parameters**

-   `match` **[function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** The function that determines whether the
           route matches. The function is passed an object with two properties:
           `url`, which is a [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL),
           and `event`, which is a [FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent).
           `match` should return a truthy value when the route applies, and
           that value is passed on to the handle function.
-   `handler` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An Object with a `handle` method. That function
           is passed an object with the same `url` and `event` properties as
           `match` received, along with an additional property, `params`,
           set to the truthy value that `match` returned.
-   `method` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** Only match requests that use this
           HTTP method. Defaults to `'GET'` if not specified.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.match`  
    -   `$0.handler`  
    -   `$0.method`  

### setDefaultHandler

[packages/sw-routing/src/lib/router.js:59-63](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/router.js#L59-L63 "Source code on GitHub")

An optional default handler will have it's handle method called when a
request doesn't have a matching route.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.handler` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An Object with a `handle` method.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.handler`  

Returns **void** 

### setCatchHandler

[packages/sw-routing/src/lib/router.js:73-77](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/router.js#L73-L77 "Source code on GitHub")

If a Route throws an error while handling a request, this catch handler
will be called to return an error case.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.handler` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An Object with a `handle` method.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.handler`  

Returns **void** 

### registerRoutes

[packages/sw-routing/src/lib/router.js:87-134](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/router.js#L87-L134 "Source code on GitHub")

Register routes will take an array of Routes to register with the
router.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.routes` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Route](#route)>** 
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.routes`  

Returns **void** 

### registerRoute

[packages/sw-routing/src/lib/router.js:143-147](https://github.com/GoogleChrome/sw-helpers/blob/b84c1e5cba772aac25825aa6b88df832294d7113/packages/sw-routing/src/lib/router.js#L143-L147 "Source code on GitHub")

Registers a single route with the router.

**Parameters**

-   `input` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
    -   `input.route` **[Route](#route)** The route to register.
-   `$0` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$0.route`  

Returns **void** 
