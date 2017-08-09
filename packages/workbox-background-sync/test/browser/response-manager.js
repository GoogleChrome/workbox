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

import IDBHelper from '../../../../lib/idb-helper.js';
import {defaultDBName} from '../../src/lib/constants.js';
import BackgroundSyncQueue from '../../src/lib/background-sync-queue.js';
import * as responseManager from '../../src/lib/response-manager.js';

describe(`response-manager`, function() {
  const response = 'VALUE';
  const idbHelper = new IDBHelper(defaultDBName, 1, 'QueueStore');

  it(`should be able to get the Response back from IDB of the given key`, () => {
    const queue = new BackgroundSyncQueue();
    return idbHelper.put('key', {response: response}).then(()=>{
        return queue.getResponse({id: 'key'}).then((data)=>{
            expect(data).to.equal(response);
        });
    });
  });

  it(`should be able to put the Response in IBD with the given key`, async function() {
    await responseManager.putResponse({
      hash: 'somehash',
      idbObject: {},
      response: new Response(response),
      idbQDb: idbHelper,
    });
    const cachedResponse = await idbHelper.get('somehash');

    // Response is stored as BLOB, using FileReader to convert back
    const reader = new window.FileReader();
    reader.readAsText(cachedResponse.response.body);

    return new Promise((resolve) => {
      reader.onloadend = () => {
        const data = reader.result;
        expect(data).to.equal(response);
        resolve();
      };
    });
  });
});
