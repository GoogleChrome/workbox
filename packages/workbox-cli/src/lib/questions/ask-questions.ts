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
    [key: string]: any
  }
  configLocation: string
}

export async function askQuestions(options = {}): Promise<ConfigWithConfigLocation> {
  const globDirectory = await askRootOfWebApp();
  const globPatterns = await askExtensionsToCache(globDirectory);
  const swSrc = ("injectManifest" in options) ? await askSWSrc() : undefined;
  const swDest = await askSWDest(globDirectory);
  const configLocation = await askConfigLocation();
  const ignoreURLParametersMatching = await askQueryParametersInStartUrl();
  const config: {[key: string]: any} = {
    globDirectory,
    globPatterns,
    ignoreURLParametersMatching,
    swDest,
  };

  if (swSrc) {
    config.swSrc = swSrc;
  }

  return {
    config,
    configLocation,
  };
}
