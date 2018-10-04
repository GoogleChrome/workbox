/*
 Copyright 2018 Google Inc. All Rights Reserved.
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

import {expect} from 'chai';
import {Deferred} from '../../../../packages/workbox-core/_private/Deferred.mjs';

describe(`[workbox-core] Deferred`, function() {
  describe(`constructor`, function() {
    it(`should create a promise and expose its resolve and reject functions as methods`, function() {
      expect(new Deferred().promise).to.be.an.instanceof(Promise);
    });
  });

  describe(`resolve`, function() {
    it(`should resolve the Deferred's promise`, function() {
      const deferred = new Deferred();
      deferred.resolve();

      return deferred.promise;
    });
  });

  describe(`reject`, function() {
    it(`should reject the Deferred's promise with the passed error`, function(done) {
      const deferred = new Deferred();
      const err1 = new Error('1');
      deferred.reject(err1);

      deferred.promise.catch((err2) => {
        expect(err1).to.eql(err2);
        done();
      });
    });
  });
});
