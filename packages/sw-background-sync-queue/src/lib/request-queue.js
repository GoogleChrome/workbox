import {getQueueableRequest} from './queue-utils';
import {broadcastMessage} from './broadcast-manager';
import {
	broadcastMessageAddedType,
	broadcastMessageFailedType,
	defaultQueueName,
	tagNamePrefix,
	allQueuesPlaceholder,
} from './constants';
import assert from '../../../../lib/assert';

let _requestCounter = 0;
let _queueCounter = 0;

/**
 * Queue class to maintain and perform on the logical requests queue
 *
 * @class RequestQueue
 * @private
 */
class RequestQueue {
	/**
	 * Creates an instance of RequestQueue.
	 *
	 * @param {Object} config
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	constructor({
		config,
		queueName = defaultQueueName + '_' + _queueCounter++,
		idbQDb,
		broadcastChannel,
	}) {
		this._isQueueNameAddedToAllQueue = false;
		this._queueName = queueName;
		this._config = config;
		this._idbQDb = idbQDb;
		this._broadcastChannel = broadcastChannel;
		this._queue = [];
		this.initQueue();
	}

	/**
	 * initializes the queue from the IDB store
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	async initQueue() {
		const idbQueue = await this._idbQDb.get(this._queueName);
		this._queue.concat(idbQueue);
	}

	/**
	 * adds the current queueName to all queue array
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	async addQueueNameToAllQueues() {
		if(!this._isQueueNameAddedToAllQueue) {
			let allQueues = await this._idbQDb.get(allQueuesPlaceholder);
			allQueues = allQueues || [];
			if(!allQueues.includes(this._queueName)) {
				allQueues.push(this._queueName);
			}
			this._idbQDb.put(allQueuesPlaceholder, allQueues);
			this._isQueueNameAddedToAllQueue = true;
		}
	}

	/**
	 * saves the logical queue to IDB
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	async saveQueue() {
		await this._idbQDb.put(this._queueName, this._queue);
	}

	/**
	 * push any request to background sync queue which would be played later
	 * preferably when network comes back
	 *
	 * @param {Request} request request object to be queued by this
	 *
	 * @memberOf Queue
	 * @private
	 */
	async push({request}) {
		assert.isInstance({request}, Request);

		const hash = `${request.url}!${Date.now()}!${_requestCounter++}`;
		const queuableRequest =
			await getQueueableRequest({
				request,
				config: this._config,
			});
		try{
			this._queue.push(hash);

			// add to queue
			this.saveQueue();
			this._idbQDb.put(hash, queuableRequest);
			await this.addQueueNameToAllQueues();
			// register sync
			self.registration &&
				self.registration.sync.register(tagNamePrefix + this._queueName);

			// broadcast the success of request added to the queue
			broadcastMessage({
				broadcastChannel: this._broadcastChannel,
				type: broadcastMessageAddedType,
				id: hash,
				url: request.url,
			});
		} catch(e) {
			// broadcast the failure of request added to the queue
			broadcastMessage({
				broadcastChannel: this._broadcastChannel,
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
	 * @return {Request} request object corresponding to given hash
	 * @memberOf Queue
	 * @private
	 */
	async getRequestFromQueue({hash}) {
		assert.isType({hash}, 'string');

		if(this._queue.includes(hash)) {
			return await this._idbQDb.get(hash);
		}
	}

	/**
	 * returns the instance of queue.
	 *
	 * @readonly
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	get queue() {
		return Object.assign([], this._queue);
	}

	/**
	 * returns the name of the current queue
	 *
	 * @readonly
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	get queueName() {
		return this._queueName;
	}

	/**
	 * returns the instance of IDBStore
	 *
	 * @readonly
	 *
	 * @memberOf RequestQueue
	 * @private
	 */
	get idbQDb() {
		return this._idbQDb;
	}
}

export default RequestQueue;
