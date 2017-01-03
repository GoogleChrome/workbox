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

**Learn More**: [About](packages/sw-appcache-behavior) •
                [Demo](packages/sw-appcache-behavior#demo) •
                [API](packages/sw-appcache-behavior#api)

### sw-background-sync-queue

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-background-sync-queue%22)][travis-url]

A service worker implementation of the a queue which is triggered by the background sync event.

**Install**: `npm install --save-dev sw-background-sync-queue`

**Learn More**: [About](packages/sw-background-sync-queue) •
                [Demo](packages/sw-background-sync-queue#demo) •
                [API](packages/sw-background-sync-queue#api)

### sw-broadcast-cache-update

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-broadcast-cache-update%22)][travis-url]

A helper library that uses the Broadcast Channel API to announce when two Response objects differ.

**Install**: `npm install --save-dev sw-broadcast-cache-update`

**Learn More**: [About](packages/sw-broadcast-cache-update) •
                [Demo](packages/sw-broadcast-cache-update#demo) •
                [API](packages/sw-broadcast-cache-update#api)

### sw-cache-expiration

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-cache-expiration%22)][travis-url]

This library is still a work in progress and is not functional.

**Install**: `npm install --save-dev sw-cache-expiration`

**Learn More**: [About](packages/sw-cache-expiration) •
                [Demo](packages/sw-cache-expiration#demo) •
                [API](packages/sw-cache-expiration#api)

### sw-cacheable-response-behavior

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-cacheable-response-behavior%22)][travis-url]

This library takes a Response object and  determines whether it&#x27;s cacheable, based on a specific configuration.

**Install**: `npm install --save-dev sw-cacheable-response-behavior`

**Learn More**: [About](packages/sw-cacheable-response-behavior) •
                [Demo](packages/sw-cacheable-response-behavior#demo) •
                [API](packages/sw-cacheable-response-behavior#api)

### sw-lib

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-lib%22)][travis-url]

A CLI tool to generate a service worker and file manifest making use of the sw-lib module.

**Install**: `npm install --save-dev sw-lib`

**Learn More**: [About](packages/sw-lib) •
                [Demo](packages/sw-lib#demo) •
                [API](packages/sw-lib#api)

### sw-lib

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-lib%22)][travis-url]

A service worker library to make managing fetch requests and caching as easy as possible.

**Install**: `npm install --save-dev sw-lib`

**Learn More**: [About](packages/sw-lib) •
                [Demo](packages/sw-lib#demo) •
                [API](packages/sw-lib#api)

### sw-offline-google-analytics

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-offline-google-analytics%22)][travis-url]

A service worker helper library to retry offline Google Analytics requests when a connection is available.

**Install**: `npm install --save-dev sw-offline-google-analytics`

**Learn More**: [About](packages/sw-offline-google-analytics) •
                [Demo](packages/sw-offline-google-analytics#demo) •
                [API](packages/sw-offline-google-analytics#api)

### sw-precaching

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-precaching%22)][travis-url]

This library is still a work in progress and is not functional.

**Install**: `npm install --save-dev sw-precaching`

**Learn More**: [About](packages/sw-precaching) •
                [Demo](packages/sw-precaching#demo) •
                [API](packages/sw-precaching#api)

### sw-routing

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-routing%22)][travis-url]

A service worker helper library to route request URLs to handlers.

**Install**: `npm install --save-dev sw-routing`

**Learn More**: [About](packages/sw-routing) •
                [Demo](packages/sw-routing#demo) •
                [API](packages/sw-routing#api)

### sw-runtime-caching

[![Build Status](https://travis-shields.appspot.com/shield/GoogleChrome/sw-helpers/master/PROJECT%3D%22sw-runtime-caching%22)][travis-url]

A service worker helper library that implements various runtime caching strategies.

**Install**: `npm install --save-dev sw-runtime-caching`

**Learn More**: [About](packages/sw-runtime-caching) •
                [Demo](packages/sw-runtime-caching#demo) •
                [API](packages/sw-runtime-caching#api)


## External Contributions

Please read the [guide to contributing](CONTRIBUTING.md) prior to filing any
pull requests.

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
[dependency-image]: https://david-dm.org/GoogleChrome/sw-helpers/dev-status.svg
[dev-dependency-url]: https://david-dm.org/GoogleChrome/sw-helpers?type=dev
[dev-dependency-image]: https://david-dm.org/GoogleChrome/sw-helpers/status.svg
