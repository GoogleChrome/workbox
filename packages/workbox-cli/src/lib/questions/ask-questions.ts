/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {askConfigLocation} from './ask-config-location';
import {askExtensionsToCache} from './ask-extensions-to-cache';
import {askRootOfWebApp} from './ask-root-of-web-app';
import {askSWDest} from './ask-sw-dest';
import {askSWSrc} from './ask-sw-src';
import {askQueryParametersInStartUrl} from './ask-start_url-query-params';

interface ConfigWithConfigLocation {
  config: {
    [key: string]: any;
  };
  configLocation: string;
}

export async function askQuestions(
  options = {},
): Promise<ConfigWithConfigLocation> {
  const isInjectManifest = 'injectManifest' in options;

  const globDirectory = await askRootOfWebApp();
  const globPatterns = await askExtensionsToCache(globDirectory);
  const swSrc = isInjectManifest ? await askSWSrc() : undefined;
  const swDest = await askSWDest(globDirectory);
  const configLocation = await askConfigLocation();
  // See https://github.com/GoogleChrome/workbox/issues/2985
  const ignoreURLParametersMatching = isInjectManifest
    ? undefined
    : await askQueryParametersInStartUrl();

  const config: {[key: string]: any} = {
    globDirectory,
    globPatterns,
    swDest,
  };

  if (swSrc) {
    config.swSrc = swSrc;
  }

  if (ignoreURLParametersMatching) {
    config.ignoreURLParametersMatching = ignoreURLParametersMatching;
  }

  return {
    config,
    configLocation,
  };
}
