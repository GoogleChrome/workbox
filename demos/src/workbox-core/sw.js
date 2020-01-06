importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

// Note: Ignore the error that Glitch raises about workbox being undefined.
workbox.setConfig({
  debug: true
});

const {core} = workbox;

const printLogs = () => {
  // ☠️ You should never so this - this is just so we can show off our logging.
  workbox.core._private.logger.debug(`🐛 Oh hai! I'm a debug message.`);
  workbox.core._private.logger.log(`🔧 Good ole log message.`);
  workbox.core._private.logger.warn(`⚠️ Uh Oh.... I'm a warning.`);
  workbox.core._private.logger.error(`☠️ Eek, stuff is breaking. p.s. I'm an error.`);
};

const printCacheNames = () => {
  workbox.core._private.logger.log(`The caches used by Workbox are...`);
  const cacheNames = workbox.core.cacheNames;
  Object.keys(cacheNames).forEach((cacheId) => {
    console.log(`    ${cacheId}: ${cacheNames[cacheId]}`);
  });
};

self.addEventListener('message', (event) => {
  switch(event.data.command) {
    case 'printLogs':
      printLogs();
      break;
    case 'printCacheNames':
      printCacheNames();
      break;
    default:
      console.log(`Unknown command received in the service worker: `, event);
  }
});