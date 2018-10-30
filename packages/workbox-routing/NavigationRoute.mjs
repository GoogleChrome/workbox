/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {assert} from 'workbox-core/_private/assert.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';
import {Route} from './Route.mjs';
import './_version.mjs';

/**
 * NavigationRoute makes it easy to create a [Route]{@link
 * workbox.routing.Route} that matches for browser
 * [navigation requests]{@link https://developers.google.com/web/fundamentals/primers/service-workers/high-performance-loading#first_what_are_navigation_requests}.
 *
 * It will only match incoming Requests whose
 * [`mode`]{@link https://fetch.spec.whatwg.org/#concept-request-mode}
 * is set to `navigate`.
 *
 * You can optionally only apply this route to a subset of navigation requests
 * by using one or both of the `blacklist` and `whitelist` parameters.
 *
 * @memberof workbox.routing
 * @extends workbox.routing.Route
 */
class NavigationRoute extends Route {
  /**
   * If both `blacklist` and `whiltelist` are provided, the `blacklist` will
   * take precedence and the request will not match this route.
   *
   * The regular expressions in `whitelist` and `blacklist`
   * are matched against the concatenated
   * [`pathname`]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname}
   * and [`search`]{@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/search}
   * portions of the requested URL.
   *
   * @param {workbox.routing.Route~handlerCallback} handler A callback
   * function that returns a Promise resulting in a Response.
   * @param {Object} options
   * @param {Array<RegExp>} [options.blacklist] If any of these patterns match,
   * the route will not handle the request (even if a whitelist RegExp matches).
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

    super((options) => this._match(options), handler);

    this._whitelist = whitelist;
    this._blacklist = blacklist;
  }

  /**
   * Routes match handler.
   *
   * @param {Object} options
   * @param {URL} options.url
   * @param {Request} options.request
   * @return {boolean}
   *
   * @private
   */
  _match({url, request}) {
    if (request.mode !== 'navigate') {
      return false;
    }

    const pathnameAndSearch = url.pathname + url.search;

    for (const regExp of this._blacklist) {
      if (regExp.test(pathnameAndSearch)) {
        if (process.env.NODE_ENV !== 'production') {
          logger.log(`The navigation route is not being used, since the ` +
              `URL matches this blacklist pattern: ${regExp}`);
        }
        return false;
      }
    }

    if (this._whitelist.some((regExp) => regExp.test(pathnameAndSearch))) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`The navigation route is being used.`);
      }
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.log(`The navigation route is not being used, since the URL ` +
          `being navigated to doesn't match the whitelist.`);
    }
    return false;
  }
}

export {NavigationRoute};
