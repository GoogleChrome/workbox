import Queue from './background-sync-queue';

/**
 * Use the instance of this class to push the failed requests into the queue.
 *
 * @example <caption>When you want the workbox-sw framework to take care of
 * failed requests.</caption>
 * let bgQueue = new workbox.backgroundSync.QueuePlugin({
 *   callbacks: {
 *     replayDidSucceed: async(hash, res) => {
 *       self.registration.showNotification('Background sync demo', {
 *         body: 'Product has been purchased.',
 *         icon: '/images/shop-icon-384.png',
 *        });
 *     },
 *     replayDidFail: (hash) => {},
 *     requestWillEnqueue: (reqData) => {},
 *     requestWillDequeue: (reqData) => {},
 *   },
 * });
 *
 * const requestWrapper = new workbox.runtimeCaching.RequestWrapper({
 *   plugins: [bgQueue],
 * });
 *
 * const route = new workbox.routing.RegExpRoute({
 *   regExp: new RegExp('^https://jsonplaceholder.typicode.com'),
 *   handler: new workbox.runtimeCaching.NetworkOnly({requestWrapper}),
 * });
 *
 * const router = new workbox.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:workbox-background-sync
 * @extends module:workbox-background-sync.Queue
 */
class QueuePlugin extends Queue {
  /**
   * Wraps `pushIntoQueue` in a callback used by higher level framework.
   * This function pushes a given request into the IndexedDb Queue.
   * NOTE: If you are writting the fetch handler for background sync manually,
   * please ignore this.
   *
   * @param {Object} input
   * @param {Request} input.request The request which is to be queued
   *
   * @return {Promise} Promise which resolves when the request is pushed in
   * the queue.
   */
  fetchDidFail({request}) {
    return this.pushIntoQueue({request});
  }
}

export default QueuePlugin;
