/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

importScripts('/__WORKBOX/buildFile/workbox-sw');

workbox.setConfig({modulePathPrefix: '/__WORKBOX/buildFile/'});

// self.addEventListener('install', () => self.skipWaiting());
// self.addEventListener('activate', () => self.clients.claim());


const VERSION = '15';


const now = () => {
  return String(Date.now()).slice(-5);
}

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

addEventListener('message', (event) => {
  // console.log(VERSION, now(), event);
});

self.addEventListener('install', async (event) => {
  // console.log(VERSION, now(), 'install');

  const doneInstalling = async () => {
    await waitFor(1000);
    // console.log(VERSION, now(), 'doneInstalling...');
  };

  // event.waitUntil(doneInstalling());
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', async (event) => {
  // console.log(VERSION, now(), 'activate');

  const doneActivating = async () => {
    await waitFor(1000);
    // console.log(VERSION, now(), 'doneActivating...');
  };

  // event.waitUntil(doneActivating());
  // event.waitUntil(self.clients.claim())
});

// console.log(VERSION, now(), 'executed!');

