import stringHash from 'string-hash';
import idbQHelper from './idbHelper';
import requestManager from './requestManager';
import bcmanager from './broadcastManager';

let _queue;
let _config;

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
	constructor() {
		this.initialize();
	}

	/**
	 * initialize the queue object from the idb
	 * giving access to any penging queues
	 * @param {Object} config config that gives values like
	 * maxAge of requests in iDB
	 *
	 * @memberOf Queue
	 */
	async initialize(config) {
		_config = config;
		_queue = await idbQHelper.get('queue') || [];
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
		let hash = stringHash(request.url + JSON.stringify(request.headers)
			+ await request.text() + Date.now());
		let queuableRequest =
			await requestManager.getQueueableRequest(request, localConfig);
		try{
			_queue.push(hash);

			// add to queue
			idbQHelper.put('queue', _queue);
			idbQHelper.put(hash, queuableRequest);

			// register sync
			self.registration.sync.register('bgqueue');

			// broadcast the success
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
		let currIndex = 0;
		for(const hash of _queue) {
			let requestData = await idbQHelper.get(hash);
			if (requestData && requestData.metadata.creationTimestamp
				+ requestData.config.maxAge > Date.now() ) {
					_queue.splice(currIndex, 1);
					idbQHelper.delete(hash);
			} else if(!requestData) {
				// remove elements from queue whose defination do not exist in idb
				_queue.splice(currIndex, 1);
			}
			currIndex ++;
		}
		idbQHelper.put('queue', _queue);
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
		if(!_queue[index]) {
			return;
		}
		let hash = _queue[index];
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
		return _queue[index];
	}

	/**
	 * get the total no of tasks in the queue
	 *
	 * @return {int} total number of tasks
	 *
	 * @memberOf Queue
	 */
	getTotalTasks() {
		return _queue.length;
	}
}

const queue = new Queue();

export default queue;
