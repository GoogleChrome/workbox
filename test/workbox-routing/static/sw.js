importScripts('../../../../packages/workbox-core/build/browser/workbox-core.dev.js');
importScripts('../../../../packages/workbox-routing/build/browser/workbox-routing.dev.js');

global.workbox.core.default.setLogLevel(
  global.workbox.core.LOG_LEVELS.debug
);

const routing = self.workbox.core.routing.default;
const Route = self.workbox.core.routing.Route;

const specialImgUrl = new URL('/static/demo/workbox-routing/demo-img.png', location).toString();
const specialImgRoute = new Route(({url}) => {
  return (url === specialImgUrl);
}, ()=> {
  return fetch('http://via.placeholder.com/300x300/ffffff/F57C00?text=Hello+from+Workbox');
});
routing.registerRoute(specialImgRoute);
