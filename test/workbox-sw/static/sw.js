importScripts('../../../packages/workbox-sw/build/browser/workbox-sw.prod.js');

const wb = new self.WorkboxSW({
  modulePathCb: (moduleName, debug) => {
    const build = debug ? 'dev' : 'prod';
    return `../../../packages/${moduleName}/build/browser/${moduleName}.${build}.js`;
  },
});

wb.core.logLevel = self.workbox.core.LOG_LEVELS.verbose;

wb.precaching.precache([
  'example.css',
  'example.js',
]);
