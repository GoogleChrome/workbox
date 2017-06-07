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

/**
 * @private
 * @return {boolean} True, if we're running in the service worker global scope.
 * False otherwise.
 */
export function isServiceWorkerGlobalScope() {
  return ('ServiceWorkerGlobalScope' in self &&
          self instanceof ServiceWorkerGlobalScope);
}

/**
 * @private
 * @return {boolean} True, if we're running a development bundle.
 * False otherwise.
 */
export function isDevBuild() {
  // `BUILD_PROCESS_REPLACE::BUILD_TARGET` is replaced during the build process.
  return `BUILD_PROCESS_REPLACE::BUILD_TARGET` === `dev`;
}

/**
 * @private
 * @return {boolean} True, if we're running on localhost or the equivalent IP
 * address. False otherwise.
 */
export function isLocalhost() {
  return Boolean(
    location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );
}
