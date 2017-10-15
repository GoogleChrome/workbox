importScripts('../../../../packages/workbox-core/build/browser/workbox-core.dev.js');
importScripts('../../../../packages/workbox-routing/build/browser/workbox-routing.dev.js');

const routing = self.workbox.routing.default;
const Route = self.workbox.routing.Route;

const specialImgUrl = new URL('/test/workbox-routing/static/demo-img.png', location).toString();
const specialImgRoute = new Route(({event}) => {
  return (event.request.url === specialImgUrl);
}, ()=> {
  return fetch('http://via.placeholder.com/300x300/ffffff/F57C00?text=Hello+from+Workbox', {mode: 'no-cors'});
});
routing.registerRoute(specialImgRoute);
