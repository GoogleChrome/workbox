import stringHash from 'string-hash';
import IDBHelper from '../../../../lib/idb-helper';

let _queue;

const idbQHelper = new IDBHelper("bgQueueSyncDB",1,"QueueStore");

class Queue {
	constructor(){
		this.initialize();
	}

	async initialize( config ){
		_queue = await idbQHelper.get("queue") || [];
	}

	async push(request, config){
		let hash = stringHash(request.url + JSON.stringify(request.headers) + await request.text() + Date.now());
		_queue.push(hash);

		//add to queue
		idbQHelper.put("queue", _queue);
		idbQHelper.put(hash, {
			request:{
				url: request.url,
				headers: JSON.stringify(request.headers),
				body: await request.text(),
				mode: request.mode,
				method: request.method,
				redirect: request.redirect
			},
			config: config,
			metadata:{
				attemptsDone: 0,
				creationTimestamp: Date.now()
			}
		});

		//register sync
		self.registration.sync.register("bgqueue");
	}

	replayRequests(){
		return idbQHelper.get("queue").then(queue => {
			if (queue.length < 1){
				return ;
			}
			
			return doFetch(0);
		});
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
}

async function getRequestFromQueueAtIndex( index ){
	let hash = _queue[index];
	let reqData = await idbQHelper.get(hash);

	let request = new Request(reqData.request.url,{
		method: reqData.request.method,
		headers: JSON.parse(reqData.request.headers)
	});

	if(request.method === "POST"){
		request.body = reqData.request.body;
	}

	return request;
}

async function doFetch(index){
	if(!_queue[index])
		return;
	let req = await getRequestFromQueueAtIndex(index);
	return fetch( req )
		.then( r => r.json() )
		.then( data =>{
			//TODO: put data in idb
			increaseAttemptCount(index);
			return doFetch( index + 1);
		})
		.catch (e => {
			increaseAttemptCount(index);
			doFetch( index + 1);
		});
}

async function increaseAttemptCount( index ){
	let hash = _queue[index];
	let reqData = await idbQHelper.get(hash);

	reqData.metadata.attemptsDone += 1;
	idbQHelper.put(hash, reqData);
} 

const queue = new Queue();

export default queue;