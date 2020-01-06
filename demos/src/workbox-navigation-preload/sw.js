importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});

// Enable navigation preload.
workbox.navigationPreload.enable();

// Swap in NetworkOnly, CacheFirst, or StaleWhileRevalidate as needed.
const strategy = new workbox.strategies.NetworkFirst({
  cacheName: 'cached-navigations',
  plugins: [
    // Any plugins, like workbox.expiration, etc.
  ],
});

const navigationRoute = new workbox.routing.NavigationRoute(strategy, {
  // Optionally, provide a whitelist/blacklist of RegExp's to determine
  // which paths will match this route.
  // whitelist: [],
  // blacklist: [],
});

workbox.routing.registerRoute(navigationRoute);

workbox.core.skipWaiting();
workbox.core.clientsClaim();