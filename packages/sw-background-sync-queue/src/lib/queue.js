import {
	getDb, 
	getQueue, 
	setIdbQueue, 
	putRequest,
	createQueue
} from './background-sync-idb-helper';
import {getQueueableRequest} from './request-manager';
import {broadcastMessage} from './broadcast-manager';
import {
	broadcastMessageAddedType,
	broadcastMessageFailedType,
	defaultQueueName,
} from './constants';

let _counter = 0;
/**
 * Core queue class that handles all the enqueue and dequeue
 * as well as cleanup code for the background sync queue
 * @class
 */
class Queue {
	/**
	 * Creates an instance of Queue.
	 *
	 * @memberOf Queue
	 */
	constructor(config, queueName) {
		this._queueName = queueName || defaultQueueName;
		this._config = config;
		this._idbQHelper = getDb();
		this._queue = getQueue(this._queueName);
		if(!this._queue){
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
	async push({request, config}) {
		let localConfig = Object.assign({}, this._config, config);
		const hash = `${request.url}!${Date.now()}!${_counter++}`;
		let queuableRequest =
			await getQueueableRequest(request, localConfig);
		try{
			this._queue.push(hash);

			// add to queue
			setIdbQueue(this._queueName, this._queue);
			this._idbQHelper.put(hash, queuableRequest);

			// register sync
			self.registration.sync.register('bgqueue');

			// broadcast the success of request added to the queue
			broadcastMessage({
				type: broadcastMessageAddedType,
				id: hash,
				url: request.url,
			});
		} catch(e) {
			console.log('err',e);
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
		if(this._queue.indexOf(hash)===-1) {
			return;
		}
		let reqData = await this._idbQHelper.get(hash);
		return reqData;
	}

	get queue() {
		return Object.assign([], this._queue);
	}
}

/**
 * clean up the queue, deleting all the tasks who are either damaged or
 * whose maxAge has expired
 *
 * @memberOf Queue
 */
async function cleanupQueue() {
	const deletionPromises = [];
	const itemsToKeep = [];
	let db = getDb();
	let queueObj = db.get('queue');
	if(!queueObj) {
		return null;
	}

	for(var taskQueue in queueObj){
		itemsToKeep = [];
		for (const hash of taskQueue) {
			let requestData = await db.get(hash);

			if (requestData && requestData.metadata &&
					requestData.metadata.creationTimestamp
					+ requestData.config.maxAge <= Date.now()) {
					// Delete items that are too old.
					deletionPromises.push(db.delete(hash));
			} else if (requestData) {
				// Keep elements whose definition exists in idb.
				itemsToKeep.push(hash);
			}
		}
		queueObj[taskQueue] = itemsToKeep;
	}

	await Promise.all(deletionPromises);
	db.put('queue', itemsToKeep);
}

export default Queue;
export {
	cleanupQueue,
};