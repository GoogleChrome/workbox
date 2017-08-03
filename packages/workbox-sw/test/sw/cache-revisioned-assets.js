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

import WorkboxSW from '../../src';

describe(`Test workboxSW.precache`, function() {
  it(`should be accessible workboxSW.precache`, function() {
    const workboxSW = new WorkboxSW();
    expect(workboxSW.precache).to.exist;
  });

  const badInput = [
    {
      capture: null,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: 123,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: true,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: false,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: {},
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: '',
      errorName: 'bad-revisioned-cache-list',
    },
  ];
  badInput.forEach((badInput) => {
    it(`should throw on adding invalid route: '${JSON.stringify(badInput)}'`, function() {
      let thrownError = null;
      const workboxSW = new WorkboxSW();
      try {
        workboxSW.precache(badInput.capture);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(badInput.errorName);
    });
  });

  it(`should be able to add arrays of items to the cache.`, function() {
    const corsOrigin = `${location.protocol}//${location.hostname}:${location.port}`;
    const validAssets1 = [
      '/__echo/date/1.1234.txt',
      {
        url: '/__echo/date/2.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/3.1234.txt`,
      {
        url: `${corsOrigin}/__echo/date/4.txt`, revision: '1234',
      },
    ];
    const validAssets2 = [
      '/__echo/date/5.1234.txt',
      {
        url: '/__echo/date/6.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/7.1234.txt`,
      {
        url: `${corsOrigin}/__echo/date/8.txt`, revision: '1234',
      },
    ];

    const workboxSW = new WorkboxSW();
    workboxSW.precache(validAssets1);
    workboxSW.precache(validAssets2);
  });
});
