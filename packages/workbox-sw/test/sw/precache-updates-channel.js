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

describe(`precacheChannelName parameter`, function() {
  it(`should create a BroadcastCacheUpdatePlugin using the default channelName when precacheChannelName is undefined`, function() {
    const workboxSW = new WorkboxSW();
    const plugins = workboxSW._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql('precache-updates');
  });

  it(`should create a BroadcastCacheUpdatePlugin using the provided precacheChannelName as the channelName`, function() {
    const precacheChannelName = 'my-test-channel';
    const workboxSW = new WorkboxSW({precacheChannelName});
    const plugins = workboxSW._revisionedCacheManager._requestWrapper.plugins;
    expect(plugins.has('cacheDidUpdate')).to.be.true;

    const broadcastCacheUpdatePlugin = plugins.get('cacheDidUpdate')[0];
    expect(broadcastCacheUpdatePlugin.channelName).to.eql(precacheChannelName);
  });

  for (let precacheChannelName of [null, false, '']) {
    it(`should not create a BroadcastCacheUpdatePlugin when precacheChannelName is ${precacheChannelName}`, function() {
      const workboxSW = new WorkboxSW({precacheChannelName});
      const plugins = workboxSW._revisionedCacheManager._requestWrapper.plugins;
      expect(plugins.has('cacheDidUpdate')).to.be.false;
    });
  }
});
