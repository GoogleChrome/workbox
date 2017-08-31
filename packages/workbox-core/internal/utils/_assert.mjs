/**
 * This method returns true if the current context is a service worker.
 */
const isServiceWorkerEnvironment = () => {
  return (typeof ServiceWorkerGlobalScope !== 'undefined' &&
    self instanceof ServiceWorkerGlobalScope);
}

export default {
  isServiceWorkerEnvironment,
};
