/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

importScripts('/__test/bundle/workbox-range-requests');

const exportedSymbols = [
  'handleRangeRequest',
  'CachedRangeResponsePlugin',
];

describe('Test Library Surface', function() {
  it('should be accessible via workbox.rangeRequests', function() {
    expect(workbox.rangeRequests).to.exist;
  });

  exportedSymbols.forEach((exportedSymbol) => {
    it(`should expose ${exportedSymbol} via workbox.rangeRequests`, function() {
      expect(workbox.rangeRequests[exportedSymbol]).to.exist;
    });
  });
});
