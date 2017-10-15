/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import './_version.mjs';

/**
 * This module is a single import that can be used to dynamically import
 * additional Workbox modules with no effort.
 *
 * @module workbox-sw
 */

const CDN_PATH = `WORKBOX_CDN_ROOT_URL`;

// TODO Make this list be generated during build time using the package.json's.
// workbox namespace value.
const MODULE_NAME_TO_KEY_MAPPING = {
  'workbox-cache-expiration': 'expiration',
  'workbox-runtime-caching': 'strategies',
};
const MODULE_KEY_TO_NAME_MAPPING = {};
for (const moduleName of Object.keys(MODULE_NAME_TO_KEY_MAPPING)) {
  const namespace = MODULE_NAME_TO_KEY_MAPPING[moduleName];
  MODULE_KEY_TO_NAME_MAPPING[namespace] = moduleName;
}

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

    return new Proxy(this, {
      get(target, key) {
        if (target[key]) {
          return target[key];
        }

        let moduleName = `workbox-${key}`;
        if (MODULE_KEY_TO_NAME_MAPPING[key]) {
           moduleName = MODULE_KEY_TO_NAME_MAPPING[key];
        }

        target.loadModule(moduleName);
        return target[key];
      },
    });
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
    if (!this._options.disableModuleImports) {
      let modulePath = this._getImportPath(moduleName);
      try {
        importScripts(modulePath);
      } catch (err) {
        // TODO Add context of this error if using the CDN vs the local file.

        // We can't rely on workbox-core being loaded so using console
        console.error(
          `Unable to import module '${moduleName}' from '${modulePath}'.`);
        throw err;
      }
    }

    this._patchWorkboxValueToSW(moduleName);
  }

  /**
   * This method will patch the globa workbox namespace value onto WorkboxSW.
   *
   * @param {string} moduleName
   */
  _patchWorkboxValueToSW(moduleName) {
    let key = MODULE_NAME_TO_KEY_MAPPING[moduleName];
    if (!key) {
      key = moduleName.replace('workbox-', '');
    }

    try {
      if (!workbox) {
        throw new Error(`The namespace 'workbox' isn't defined.`);
      }
      if (!workbox[key]) {
        throw new Error(`The namespace 'workbox.${key}' isn't defined.`);
      }

      // Add the key to the target (i.e. instance of WorkboxSW)
      // so the next access doesn't attempt to load the module again.
      if (workbox[key].default) {
        // Most cases developers will only want the default export
        this[key] = workbox[key].default;
      } else {
        // For modules with no default export, make all classes hang off
        // of WorkboxSW.
        this[key] = workbox[key];
      }
    } catch (err) {
      // We can't rely on workbox-core being loaded so using console
      console.error(
        `Unable to initialise '${moduleName}'. This occurs when an invalid ` +
        `module name is used or 'disableModuleImports' is set to true and ` +
        `the module isn't manually imported into the service worker.`);
      throw err;
    }
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
    let pathParts = [CDN_PATH];

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
