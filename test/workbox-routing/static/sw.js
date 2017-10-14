importScripts('../../../../packages/workbox-core/build/browser/workbox-core.dev.js');
importScripts('../../../../packages/workbox-routing/build/browser/workbox-routing.dev.js');

workbox.core.default.setLogLevel(
  workbox.core.LOG_LEVELS.debug
);

const routing = workbox.routing.default;

const specialImgUrl = new URL('/static/demo/workbox-routing/demo-img.png', location).toString();
const specialImgRoute = new workbox.routing.Route(({url}) => {
  return (url === specialImgUrl);
}, ()=> {
  return fetch('http://via.placeholder.com/300x300/ffffff/F57C00?text=Hello+from+Workbox');
});
routing.registerRoute(specialImgRoute);
