import stringHash from 'string-hash';
import idbQHelper from './idbHelper';
import requestManager from './requestManager';
import bcmanager from './broadcastManager';

let _queue;
let _config;

class Queue {
	constructor() {
		this.initialize();
	}

	async initialize(config) {
		_config = config;
		_queue = await idbQHelper.get('queue') || [];
	}

	async push(request, config) {
		try{
			let localConfig = Object.assign({}, _config, config);
			let hash = stringHash(request.url + JSON.stringify(request.headers)
				+ await request.text() + Date.now());
			let queuableRequest =
				await requestManager.getQueueableRequest(request, localConfig);
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
				request: queuableRequest,
			});
		}
	}

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

	async getRequestFromQueueAtIndex( index ) {
		if(!_queue[index]) {
			return;
		}
		let hash = _queue[index];
		let reqData = await idbQHelper.get(hash);
		return reqData;
	}

	getHash( index ) {
		return _queue[index];
	}

	getTotalTasks() {
		return _queue.length;
	}
}

const queue = new Queue();

export default queue;
