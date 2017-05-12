import Queue from './background-sync-queue';

/**
 * Use the instance of this class to push the failed requests into the queue.
 *
 * @example
 * When you want the workbox-sw framework to take care of failed
 * // requests
 * let bgQueue = new goog.backgroundSync.QueuePlugin({callbacks:
 *		{
 *			onResponse: async(hash, res) => {
 *				self.registration.showNotification('Background sync demo', {
 *  				body: 'Product has been purchased.',
 *	 	 			icon: 'https://shop.polymer-project.org/images/shop-icon-384.png',
 *				});
 *			},
 *			onRetryFailure: (hash) => {},
 *		},
 * });
 *
 * const requestWrapper = new goog.runtimeCaching.RequestWrapper({
 * 	plugins: [bgQueue],
 * });
 *
 * const route = new goog.routing.RegExpRoute({
 * 	regExp: new RegExp('^https://jsonplaceholder.typicode.com'),
 * 	handler: new goog.runtimeCaching.NetworkOnly({requestWrapper}),
 * });
 *
 * const router = new goog.routing.Router();
 * router.registerRoute({route});
 *
 * @memberof module:queue-plugin
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
