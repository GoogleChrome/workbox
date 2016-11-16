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
 * sw-background-sync-queue Module
 *
 * @module sw-background-sync-queue
 */

import requestManager from './lib/request-manager';
import queue from './lib/queue';

function initialize(config, callbacks) {
	requestManager.initialize(config, callbacks);
}

function pushIntoQueue(request, config) {
	queue.push(request, config);
}

export {initialize, pushIntoQueue};
