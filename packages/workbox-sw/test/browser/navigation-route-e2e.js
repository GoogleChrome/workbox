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

describe(`End to End Test of registerNavigationRoute()`, function() {
  // This uses {once: true} to ensure that each load event handler is only called once.
  // It also modifies the iframe.src instead of using fetch(), since you can't use fetch()
  // to make a request with mode === 'navigate'.
  it(`should serve the App Shell content based on the whitelist/blacklist`, function(callback) {
    goog.swUtils.activateSW('../static/sw/navigation-route.js')
      .then((iframe) => {
        iframe.addEventListener('load', () => {
          expect(iframe.contentWindow.document.body.innerText).to.equal('navigation');

          iframe.addEventListener('load', () => {
            expect(iframe.contentWindow.document.body.innerText).not.to.equal('navigation');
            callback();
          }, {once: true});

          iframe.src = iframe.src + '/blacklisted';
        }, {once: true});

        iframe.src = iframe.src + '/navigation';
      });
  });
});
