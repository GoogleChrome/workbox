/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

function initComlink() {
  const channel = new MessageChannel();
  navigator.serviceWorker.controller.postMessage(channel.port2, [
    channel.port2,
  ]);
  window._runInSW = Comlink.wrap(channel.port1);
  channel.port1.start();
}

const scriptEl = document.createElement('script');
scriptEl.src = '/__WORKBOX/comlink.js';
scriptEl.addEventListener('load', () => {
  if (navigator.serviceWorker.controller) {
    initComlink();
  }
  navigator.serviceWorker.addEventListener('controllerchange', initComlink);
});
document.body.appendChild(scriptEl);
