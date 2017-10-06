/**
 * This module is a single import that can be used to dynamically import
 * additional Workbox modules with no effort.
 *
 * @module workbox-sw
 */

/**
 * This class can be used to make it easy to use the various parts of
 * Workbox.
 */
class WorkboxSW {
  /**
   * You can specify whether to treat as a debug
   * build and whether to use a CDN or a specific path when importing other
   * workbox-modules
   *
   * @param {Object} options
   */
  constructor(options) {
    this._options = Object.assign({
      debug: self.location.hostname === 'localhost',
      pathPrefix: null,
    }, options);
  }

  /**
   * Force a service worker to become active, instead of waiting. This is
   * normally used in conjunction with `clientsClaim()`.
   */
  skipWaiting() {
    self.addEventListener('install', () => self.skipWaiting());
  }

  /**
   * Claim any currently available clients once the service worker
   * becomes active. This is normally used in conjunction with `skipWaiting()`.
   */
  clientsClaim() {
    self.addEventListener('activate', () => self.clients.claim());
  }
}

export {WorkboxSW};
