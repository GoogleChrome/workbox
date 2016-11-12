import { initializationDefaults } from './constants';
import queue from './queue.js';
import { idbQueue } from './idbHelper';

let globalConfig = initializationDefaults;
let callbacks = {};

class RequestManager{
	async initialize(config, callbacks){
		globalConfig = Object.assign({}, initializationDefaults, config);
		callbacks = callbacks;
		await queue.initialize( globalConfig, callbacks );
		await queue.cleanupQueue();
		attachSyncHandler();
	}

	attachSyncHandler(){
		self.addEventListener('sync',e=>{
			return requestManager.replayRequests();
		});
	}

	replayRequests(){
		return idbQueue.then(queue => {
			if (queue.length < 1){
				return ;
			}
			
			return doFetch(0);
		});
	}

	doFetch(index){
		if(!_queue[index])
			return;

		let reqData = queue.getRequestFromQueueAtIndex(index);
		
		let request = new Request(reqData.request.url,{
			method: reqData.request.method,
			headers: JSON.parse(reqData.request.headers)
		});

		if(request.method === "POST"){
			request.body = reqData.request.body;
		}

		let reqClone = req.clone();
		return fetch( req )
			.then( response => {
				//putResponse(response.clone());
				_callbacks.onRetrySuccess && _callbacks.onRetrySuccess( reqClone, response);
				return response.json(); 
			})
			.then( data =>{
				//TODO: put data in idb
				return doFetch( index + 1);
			})
			.catch (e => {
				_callbacks.onRetryFailure && _callbacks.onRetryFailure( reqClone ); 
				doFetch( index + 1);
			});
	}

	// takes a request and gives back JSON object that is storable in IDB
	async getQueueableRequest(request){
		return {
			request:{
				url: request.url,
				headers: JSON.stringify(request.headers),
				body: await request.text(),
				mode: request.mode,
				method: request.method,
				redirect: request.redirect
			},
			config: globalConfig,
			metadata:{
				attemptsDone: 0,
				creationTimestamp: Date.now()
			}
		};
	}

}


const reqManager = new RequestManager();

export default reqManager;