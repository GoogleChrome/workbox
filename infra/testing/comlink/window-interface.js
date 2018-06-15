function initComlink() {
  const channel = new MessageChannel();
  navigator.serviceWorker.controller.postMessage(channel.port2, [channel.port2]);
  window._runInSW = Comlink.proxy(channel.port1);
  channel.port1.start();
}

const scriptEl = document.createElement('script');
scriptEl.src = '/comlink.js';
scriptEl.addEventListener('load', () => {
  if (navigator.serviceWorker.controller) {
    initComlink();
  }
  navigator.serviceWorker.addEventListener('controllerchange', initComlink);
});
document.body.appendChild(scriptEl);
