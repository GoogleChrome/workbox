import stringHash from 'string-hash';
import { idbQueue } from './idbHelper';
import requestManager from './requestManager';

let _queue;
let _config;

class Queue {
	constructor(){
		this.initialize();
	}

	async initialize( config ){
		_config = config;
		_queue = idbQueue || [];
	}

	async push(request, config){
		let hash = stringHash(request.url + JSON.stringify(request.headers) + await request.text() + Date.now());
		_queue.push(hash);
		config = Object.assign({}, config, _config);

		//add to queue
		idbQHelper.put("queue", _queue);
		idbQHelper.put(hash, requestManager.getQueueableRequest(request));

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
		let hash = _queue[index];
		let reqData = await idbQHelper.get(hash);
		return reqData;
	}

}

async function putResponse( reponse ){
	//TODO: implement this
}

const queue = new Queue();

export default queue;