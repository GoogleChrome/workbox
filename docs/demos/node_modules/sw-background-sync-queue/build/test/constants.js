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
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.goog = global.goog || {}, global.goog.backgroundSyncQueue = global.goog.backgroundSyncQueue || {}, global.goog.backgroundSyncQueue.test = global.goog.backgroundSyncQueue.test || {}, global.goog.backgroundSyncQueue.test.constants = global.goog.backgroundSyncQueue.test.constants || {})));
}(this, (function (exports) { 'use strict';

const maxAge = 5 * 24 * 60 * 60 * 1000; // 5days
const defaultBroadcastChannelName = 'sw-backgroundsync';
const defaultDBName = 'bgQueueSyncDB';
const broadcastMessageAddedType = 'BACKGROUND_REQUESTED_ADDED';
const broadcastMessageFailedType = 'BACKGROUND_REQUESTED_FAILED';
const defaultQueueName = 'DEFAULT_QUEUE';
const tagNamePrefix = 'SW_BACKGROUND_QUEUE_TAG_';
const broadcastMeta = 'SW_BACKGROUND_SYNC_QUEUE';
const allQueuesPlaceholder = 'QUEUES';

exports.maxAge = maxAge;
exports.defaultBroadcastChannelName = defaultBroadcastChannelName;
exports.defaultDBName = defaultDBName;
exports.broadcastMessageAddedType = broadcastMessageAddedType;
exports.broadcastMessageFailedType = broadcastMessageFailedType;
exports.defaultQueueName = defaultQueueName;
exports.tagNamePrefix = tagNamePrefix;
exports.broadcastMeta = broadcastMeta;
exports.allQueuesPlaceholder = allQueuesPlaceholder;

Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=constants.js.map
