<!-- To make changes, edit templates/README.hbs, not README.md! -->
[![Build Status][travis-image]][travis-url]
[![Dependency Status][dependency-image]][dependency-url]
[![Dev Dependency Status][dev-dependency-image]][dev-dependency-url]

# SW Helpers

## The Libraries
### sw-appcache-behavior

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-appcache-behavior%22)][travis-url]

A service worker implementation of the behavior defined in a page&#x27;s App Cache manifest.

**Install**: `npm install --save-dev sw-appcache-behavior`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-appcache-behavior.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-appcache-behavior/demo)

### sw-background-sync-queue

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-background-sync-queue%22)][travis-url]

Queues failed requests and uses the Background Sync API to replay those requests at a later time when the network state has changed.

**Install**: `npm install --save-dev sw-background-sync-queue`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-background-sync-queue.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-background-sync-queue/demo)

### sw-broadcast-cache-update

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-broadcast-cache-update%22)][travis-url]

A helper library that uses the Broadcast Channel API to announce when two Response objects differ.

**Install**: `npm install --save-dev sw-broadcast-cache-update`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-broadcast-cache-update.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-broadcast-cache-update/demo)

### sw-cache-expiration

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-cache-expiration%22)][travis-url]

This library is still a work in progress and is not functional.

**Install**: `npm install --save-dev sw-cache-expiration`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-cache-expiration.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-cache-expiration/demo)

### sw-cacheable-response-behavior

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-cacheable-response-behavior%22)][travis-url]

This library takes a Response object and determines whether it&#x27;s cacheable, based on a specific configuration.

**Install**: `npm install --save-dev sw-cacheable-response-behavior`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-cacheable-response-behavior.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-cacheable-response-behavior/demo)

### sw-cli

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-cli%22)][travis-url]

A CLI tool to generate a service worker and a file manifest making use of the sw-lib module.

**Install**: `npm install --save-dev sw-cli`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-cli.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-cli/demo)

### sw-lib

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-lib%22)][travis-url]

A service worker library to make managing fetch requests and caching as easy as possible.

**Install**: `npm install --save-dev sw-lib`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-lib.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-lib/demo)

### sw-offline-google-analytics

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-offline-google-analytics%22)][travis-url]

A service worker helper library to retry offline Google Analytics requests when a connection is available.

**Install**: `npm install --save-dev sw-offline-google-analytics`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-offline-google-analytics.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-offline-google-analytics/demo)

### sw-precaching

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-precaching%22)][travis-url]

This library is still a work in progress and is not functional.

**Install**: `npm install --save-dev sw-precaching`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-precaching.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-precaching/demo)

### sw-routing

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-routing%22)][travis-url]

A service worker helper library to route request URLs to handlers.

**Install**: `npm install --save-dev sw-routing`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-routing.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-routing/demo)

### sw-runtime-caching

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-runtime-caching%22)][travis-url]

A service worker helper library that implements various runtime caching strategies.

**Install**: `npm install --save-dev sw-runtime-caching`

**Learn More**: [About](https://googlechrome.github.io/sw-helpers/reference-docs/stable/latest/module-sw-runtime-caching.html) •
                [Demo Code](https://github.com/GoogleChrome/sw-helpers/tree/master/packages/sw-runtime-caching/demo)


## External Contributions

Please read the [guide to contributing](https://googlechrome.github.io/sw-helpers/contributing.html)
prior to filing any pull requests.

## License

Copyright 2016 Google, Inc.

Licensed under the [Apache License, Version 2.0](LICENSE) (the "License");
you may not use this file except in compliance with the License. You may
obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[npm-url]: https://npmjs.org/package/sw-helpers
[npm-image]: https://badge.fury.io/js/sw-helpers.svg
[travis-url]: https://travis-ci.org/GoogleChrome/sw-helpers
[travis-image]: https://travis-ci.org/GoogleChrome/sw-helpers.svg?branch=master
[dependency-url]: https://david-dm.org/GoogleChrome/sw-helpers/
[dependency-image]: https://david-dm.org/GoogleChrome/sw-helpers/status.svg
[dev-dependency-url]: https://david-dm.org/GoogleChrome/sw-helpers?type=dev
[dev-dependency-image]: https://david-dm.org/GoogleChrome/sw-helpers/dev-status.svg
