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

import assert from '../../../../lib/assert';
import broadcastUpdate from './broadcast-update';
import sameResponses from './same-responses';
import {defaultHeadersToCheck, defaultSource} from './constants';

export default class CacheUpdateNotificationManager {
  constructor({channelName, cacheName, headersToCheck, source}={}) {
    assert.isType({channelName}, 'string');
    assert.isType({cacheName}, 'string');

    this.headersToCheck = headersToCheck || defaultHeadersToCheck;
    this.source = source || defaultSource;
    this.channelName = channelName;
    this.cacheName = cacheName;
  }

  get channel() {
    if (!this._channel) {
      this._channel = new BroadcastChannel(this.channelName);
    }
    return this._channel;
  }

  notifyIfUpdated({first, second}={}) {
    assert.isType({cacheName}, 'string');

    if (!sameResponses({first, second, headersToCheck: this.headersToCheck})) {
      broadcastUpdate({cacheName: this.cacheName, url: second.url,
        channel: this.channel, source: this.source});
    }
  }
};
