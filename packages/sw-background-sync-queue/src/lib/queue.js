import idbQHelper from './idb-helper';
import {getQueueableRequest} from './request-manager';
import bcmanager from './broadcast-manager';

let _config;
let _counter = 0;

/**
 * Core queue class that handles all the enqueue and dequeue
 * as well as cleanup code for the background sync queue
 * @class Queue
 */
class Queue {
	/**
	 * Creates an instance of Queue.
	 *
	 * @memberOf Queue
	 */
	constructor(config) {
		_config = config;
		this.queue = [];
	}

	/**
	 * initialize the queue object from the idb
	 * giving access to any penging queues
	 * @param {Object} config config that gives values like
	 * maxAge of requests in iDB
	 *
	 * @memberOf Queue
	 */
	async initialize() {
		this.queue = await idbQHelper.get('queue') || [];
	}

	/**
	 * push any request to background sync queue which would be played later
	 * prefferably when network comes back
	 *
	 * @param {Request} request request object to be queued by this
	 * @param {Object} config optional config to override config params
	 *
	 * @memberOf Queue
	 */
	async push(request, config) {
		let localConfig = Object.assign({}, _config, config);
		const hash = `${request.url}!${Date.now()}!${_counter++}`;
		let queuableRequest =
			await getQueueableRequest(request, localConfig);
		try{
			this.queue.push(hash);

			// add to queue
			idbQHelper.put('queue', this.queue);
			idbQHelper.put(hash, queuableRequest);

			// register sync
			self.registration.sync.register('bgqueue');

			// broadcast the success
			// TODO: put fsa format here
			bcmanager.postMessage({
				status: 'success',
				id: hash,
				request: queuableRequest,
			});
		} catch(e) {
			// broadcast the success
			bcmanager.postMessage({
				status: 'failed',
				request: request,
			});
		}
	}

	/**
	 * clean up the queue, deleting all the tasks who are either damaged or
	 * whose maxAge has expired
	 *
	 * @memberOf Queue
	 */
	async cleanupQueue() {
		const itemsToKeep = [];
		const deletionPromises = [];

		for (const hash of this.queue) {
			let requestData = await idbQHelper.get(hash);

			if (requestData && requestData.metadata &&
					requestData.metadata.creationTimestamp
					+ requestData.config.maxAge > Date.now()) {
					// Delete items that are too old.
					deletionPromises.push(idbQHelper.delete(hash));
			} else if (requestData) {
				// Keep elements whose definition exists in idb.
				itemsToKeep.push(hash);
			}
		}

		await Promise.all(deletionPromises);
		await idbQHelper.put('queue', itemsToKeep);
		this.queue=itemsToKeep
	}

	/**
	 * get the Request from the queue at a particular index
	 *
	 * @param {int} index
	 * @return {Request} hash of the request at the given index
	 *
	 * @memberOf Queue
	 */
	async getRequestFromQueueAtIndex( index ) {
		if(!this.queue[index]) {
			return;
		}
		let hash = this.queue[index];
		let reqData = await idbQHelper.get(hash);
		return reqData;
	}

	/**
	 * get the hash from the queue at a particular index
	 *
	 * @param {int} index
	 * @return {string} hash of the request at the given index
	 *
	 * @memberOf Queue
	 */
	getHash( index ) {
		return this.queue[index];
	}

	/**
	 * get the total no of tasks in the queue
	 *
	 * @return {int} total number of tasks
	 *
	 * @memberOf Queue
	 */
	getTotalTasks() {
		return this.queue.length;
	}
	
}


export default Queue;
