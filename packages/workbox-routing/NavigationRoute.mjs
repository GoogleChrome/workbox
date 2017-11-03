/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import {assert, logger} from 'workbox-core/_private.mjs';
import {Route} from './Route.mjs';
import './_version.mjs';

/**
 * NavigationRoute is a helper class to create a [Route]{@link
 * module:workbox-routing.Route} that matches for browser navigation requests,
 * i.e. requests for HTML pages.
 *
 * It will only match incoming requests whose [`mode`](https://fetch.spec.whatwg.org/#concept-request-mode)
 * is set to `navigate`.
 *
 * You can optionally only apply this route to a subset of navigation requests
 * by using one or both of the `blacklist` and `whitelist` parameters. If
 * both lists are provided, the blacklist will take precedence and the request
 * will not be matched by this route.
 *
 * The regular expressions in `whitelist` and `blacklist`
 * are matched against the concatenated
 * [`pathname`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname)
 * and [`search`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/search)
 * portions of the requested URL.
 *
 * @memberof module:workbox-routing
 * @extends Route
 */
class NavigationRoute extends Route {
  /**
   * Constructor for NavigationRoute.
   *
   * @param {function|module:workbox-runtime-caching.Handler} handler The
   * handler to use to provide a response if the route matches.
   * @param {Object} options
   * @param {Array<RegExp>} [options.blacklist] If any of these patterns match,
   * the route will not handle the request (even if a whitelist entry matches).
   * @param {Array<RegExp>} [options.whitelist=[/./]] If any of these patterns
   * match the URL's pathname and search parameter, the route will handle the
   * request (assuming the blacklist doesn't match).
   */
  constructor(handler, {whitelist = [/./], blacklist = []} = {}) {
    if (process.env.NODE_ENV !== 'production') {
      assert.isArrayOfClass(whitelist, RegExp, {
        moduleName: 'workbox-routing',
        className: 'NavigationRoute',
        funcName: 'constructor',
        paramName: 'options.whitelist',
      });
      assert.isArrayOfClass(blacklist, RegExp, {
        moduleName: 'workbox-routing',
        className: 'NavigationRoute',
        funcName: 'constructor',
        paramName: 'options.blacklist',
      });
    }

    super((...args) => this._match(...args), handler);

    this._whitelist = whitelist;
    this._blacklist = blacklist;
  }

  /**
   * Routes match handler.
   *
   * @param {Object} input
   * @param {FetchEvent} input.event
   * @param {URL} input.url
   * @return {boolean}
   */
  _match({event, url}) {
    if (event.request.mode !== 'navigate') {
      return false;
    }

    const pathnameAndSearch = url.pathname + url.search;

    if (this._blacklist.some((regExp) => regExp.test(pathnameAndSearch))) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`The navigation route is not being used, since the ` +
          `request URL matches both the whitelist and blacklist.`);
      }
      return false;
    }

    if (this._whitelist.some((regExp) => regExp.test(pathnameAndSearch))) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`The navigation route is being used.`);
      }
      return true;
    } else {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(
          `The navigation route is not being used, since the ` +
          `URL being navigated to doesn't match the whitelist.`
        );
      }
    }

    return false;
  }
}

export {NavigationRoute};
