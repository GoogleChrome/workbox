import stringHash from 'string-hash';
import idbQHelper from './idbHelper';
import requestManager from './requestManager';

let _queue;
let _config;

class Queue {
	constructor(){
		this.initialize();
	}

	async initialize( config ){
		_config = config;
		_queue = await idbQHelper.get("queue") || [];
	}

	async push(request, config){
		let localConfig = Object.assign({}, _config, config);
		let hash = stringHash(request.url + JSON.stringify(request.headers) + await request.text() + Date.now());
		_queue.push(hash);

		//add to queue
		idbQHelper.put("queue", _queue);
		idbQHelper.put(hash, await requestManager.getQueueableRequest(request, localConfig));

		//register sync
		self.registration.sync.register("bgqueue");
	}

	async cleanupQueue(){
		let currIndex = 0;
		for(const hash of _queue){
			let requestData = await idbQHelper.get(hash);
			if (requestData && (requestData.metadata.attemptsDone >= requestData.config.maxRetry
				|| Date.now() > (requestData.metadata.creationTimestamp + requestData.config.maxResponseRetention) )) {
					_queue.splice(currIndex,1);
					idbQHelper.delete(hash);
			} else if(!requestData){
				//remove elements from queue whose defination do not exist in idb
				_queue.splice(currIndex,1);
			} 
			currIndex ++; 
		}
		idbQHelper.put("queue", _queue);
	}

	async getRequestFromQueueAtIndex( index ){
		if(!_queue[index]){
			return;
		}
		
		let hash = _queue[index];
		let reqData = await idbQHelper.get(hash);
		return reqData;
	}

	getHash( index ){
		return _queue[index];
	}

	getTotalTasks(){
		return _queue.length;
	}
}

const queue = new Queue();

export default queue;