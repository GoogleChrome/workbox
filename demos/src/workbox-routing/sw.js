importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-sw.js');

workbox.setConfig({
  debug: true
});

// Set logs level to `debug` to view all logs
// workbox.core.setLogLevel(workbox.core.LOG_LEVELS.debug);

// Set up a route to alter the demo-img
const matchCb = ({url, event}) => {
  return url.pathname === '/public/demo-img.png';
};

const handlerCb = ({url, event, params}) => {
  return fetch('/public/demo-popper.png');
};

// First parameter can be a string, RegExp, workbox Route, or a match callback (used here)
// Second parameter handles the response and must return a Response promise
workbox.routing.registerRoute(matchCb, handlerCb);

const GLITCH_ICO_URL = 'https://glitch.com/edit/favicon-app.ico';
workbox.routing.registerRoute(GLITCH_ICO_URL, () => {
  // Demonstrating when an error is thrown by a Route.
  throw new Error(`Example error thrown from the default handler`);
});

workbox.routing.setCatchHandler(({event}) => {
  return fetch(event.request);
});