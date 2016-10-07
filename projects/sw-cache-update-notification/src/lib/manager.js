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
import responsesAreSame from './responses-are-same';
import {defaultHeadersToCheck, defaultSource} from './constants';

export default class Manager {
  constructor({channelName, headersToCheck, source}={}) {
    assert.isType({channelName}, 'string');

    this.headersToCheck = headersToCheck || defaultHeadersToCheck;
    this.source = source || defaultSource;
    this.channelName = channelName;
  }

  get channel() {
    if (!this._channel) {
      this._channel = new BroadcastChannel(this.channelName);
    }
    return this._channel;
  }

  cacheDidUpdate({cacheName, oldResponse, newResponse}={}) {
    assert.isType({cacheName}, 'string');
    assert.isInstance({newResponse}, Response);

    if (oldResponse) {
      this.notifyIfUpdated({cacheName, first: oldResponse, second: newResponse});
    }
  }

  notifyIfUpdated({first, second, cacheName}={}) {
    assert.isType({cacheName}, 'string');

    if (!responsesAreSame({first, second, headersToCheck: this.headersToCheck})) {
      broadcastUpdate({cacheName, url: second.url,
        channel: this.channel, source: this.source});
    }
  }
};
