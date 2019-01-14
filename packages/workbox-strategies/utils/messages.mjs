/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import '../_version.mjs';

const getFriendlyURL = (url) => {
  const urlObj = new URL(url, location);
  if (urlObj.origin === location.origin) {
    return urlObj.pathname;
  }
  return urlObj.href;
};

export const messages = {
  strategyStart: (strategyName, request) => `Using ${strategyName} to ` +
    `respond to '${getFriendlyURL(request.url)}'`,
  printFinalResponse: (response) => {
    if (response) {
      logger.groupCollapsed(`View the final response here.`);
      logger.log(response);
      logger.groupEnd();
    }
  },
};
