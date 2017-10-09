/**
 * This module is a single import that can be used to dynamically import
 * additional Workbox modules with no effort.
 *
 * @module workbox-sw
 */

const CDN_PATH = `https://storage.googleapis.com/workbox-cdn/releases`;
const VERSION = `WORKBOX_VERSION_TAG`;

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
      modulePathPrefix: null,
      modulePathCb: null,
      disableModuleImports: false,
    }, options);
    this._env = this._options.debug ? 'dev' : 'prod';

    if (!this._options.disableModuleImports) {
      this.loadModule('workbox-core');
    }
  }

  /**
   * Get workbox-core.
   */
  get core() {
    return workbox.core.default;
  }

  /**
   * Get workbox-precaching.
   */
  get precaching() {
    this.loadModule('workbox-precaching');

    return workbox.precaching.default;
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

  /**
   * Load a Workbox module by passing in the appropriate module name.
   *
   * @param {string} moduleName
   */
  loadModule(moduleName) {
    if (this._options.disableModuleImports) {
      // This can't be a WorkboxError as we can't rely on workbox-core being
      // loaded.
      throw new Error(
        `Attempted to load '${moduleName}' while disableModuleImports is true.`
      );
    }

    importScripts(this._getImportPath(moduleName));
  }

  /**
   * This method will get the path / CDN URL to be used for importScript calls.
   *
   * @param {string} moduleName
   * @return {string} URL to the desired module.
   *
   * @private
   */
  _getImportPath(moduleName) {
    if (this._options.modulePathCb) {
      return this._options.modulePathCb(moduleName, this._options.debug);
    }

    // TODO: This needs to be dynamic some how.
    let pathParts = [CDN_PATH, VERSION];

    const fileName = `${moduleName}.${this._env}.js`;

    const pathPrefix = this._options.modulePathPrefix;
    if (pathPrefix) {
      // Split to avoid issues with developers ending / not ending with slash
      pathParts = pathPrefix.split('/');

      // We don't need a slash at the end as we will be adding
      // a filename regardless
      if (pathParts[pathParts.length - 1] === '') {
        pathParts.splice(pathParts.length - 1, 1);
      }
    }

    pathParts.push(fileName);

    return pathParts.join('/');
  }
}

export default WorkboxSW;
