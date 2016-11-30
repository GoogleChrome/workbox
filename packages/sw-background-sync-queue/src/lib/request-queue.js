import {
	getDb,
	getQueue,
	setIdbQueue,
	createQueue,
} from './background-sync-idb-helper';
import {getQueueableRequest} from './queue-utils';
import {broadcastMessage} from './broadcast-manager';
import {
	broadcastMessageAddedType,
	broadcastMessageFailedType,
	defaultQueueName,
	tagNamePrefix,
} from './constants';

let _requestCounter = 0;
let _queueCounter = 0;
/**
 * Core queue class that handles all the enqueue and dequeue
 * as well as cleanup code for the background sync queue
 * @class
 */
class RequestQueue {
	/**
	 * Creates an instance of Queue.
	 *
	 * @memberOf Queue
	 */
	constructor({config, queueName}) {
		this._queueName = queueName || defaultQueueName + '_' + _queueCounter++;
		this._config = config;
		this._idbQHelper = getDb();
		this._queue = getQueue(this._queueName);
		if(!this._queue) {
			this._queue = createQueue(this._queueName);
		}
	}

	/**
	 * push any request to background sync queue which would be played later
	 * preferably when network comes back
	 *
	 * @param {Request} request request object to be queued by this
	 * @param {Object} config optional config to override config params
	 *
	 * @memberOf Queue
	 */
	async push({request}) {
		this._queue = getQueue(this._queueName);
		const hash = `${request.url}!${Date.now()}!${_requestCounter++}`;
		let queuableRequest =
			await getQueueableRequest(request, this._config);
		try{
			this._queue.push(hash);

			// add to queue
			setIdbQueue(this._queueName, this._queue);
			this._idbQHelper.put(hash, queuableRequest);

			// register sync
			self.registration.sync.register(tagNamePrefix + this._queueName);

			// broadcast the success of request added to the queue
			broadcastMessage({
				type: broadcastMessageAddedType,
				id: hash,
				url: request.url,
			});
		} catch(e) {
			// broadcast the failure of request added to the queue
			broadcastMessage({
				type: broadcastMessageFailedType,
				id: hash,
				url: request.url,
			});
		}
	}

	/**
	 * get the Request from the queue at a particular index
	 *
	 * @param {string} hash hash of the request at the given index
	 * @return {Request}
	 *
	 * @memberOf Queue
	 */
	async getRequestFromQueue(hash) {
		if(this._queue.includes(hash)) {
			let reqData = await this._idbQHelper.get(hash);
			return reqData;
		}
	}

	get queue() {
		return Object.assign([], this._queue);
	}

	get queueName() {
		return this._queueName;
	}
}

export default RequestQueue;
