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

import {_private} from 'workbox-core';

export default (strategyName, event, logMessages, response) => {
  if (process.env.NODE_ENV !== 'production') {
    const urlObj = new URL(event.request.url);
    const urlToDisplay = urlObj.origin === location.origin ?
      urlObj.pathname : urlObj.href;
    _private.logger.groupCollapsed(`Using ${strategyName} to repond to ` +
      `'${urlToDisplay}'`);
    logMessages.forEach((msg) => {
      if (Array.isArray(msg)) {
        _private.logger.unprefixed.log(...msg);
      } else {
        _private.logger.unprefixed.log(msg);
      }
    });

    if (response) {
      _private.logger.groupCollapsed(`View the final response here.`);
      _private.logger.unprefixed.log(response);
      _private.logger.groupEnd();
    }

    _private.logger.groupEnd();
  }
};
