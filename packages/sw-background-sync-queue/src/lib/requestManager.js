import { initializationDefaults } from './constants';
import queue from './queue.js';
import responseManager from './responseManager';
let globalConfig = initializationDefaults;
let globalCallbacks = {};

class RequestManager{
	async initialize(config, callbacks){
		this.attachSyncHandler();
		globalConfig = Object.assign({}, initializationDefaults, config);
		globalCallbacks = callbacks;
		await queue.initialize( globalConfig );
		await queue.cleanupQueue();
	}

	attachSyncHandler(){
		self.addEventListener('sync', e => {
			e.waitUntil(this.replayRequests());
		});
	}

	replayRequests(){
		if (queue.getTotalTasks() < 1){
			return ;
		}
		return this.doFetch(0);
	}

	async doFetch(index){
		let reqData = await queue.getRequestFromQueueAtIndex(index);
		let hash = queue.getHash(index);
		//exit point
		if(!reqData){
			return;
		}

		//proceed if response do not already exist
		if(reqData.response){
			return this.doFetch(index + 1);
		}


		let request = new Request(reqData.request.url,{
			method: reqData.request.method,
			headers: JSON.parse(reqData.request.headers)
		});

		if(request.method === "POST"){
			request.body = reqData.request.body;
		}

		let reqClone = request.clone();
		return fetch( request )
			.then( response => {
				responseManager.putResponse(hash, reqData,  response.clone());
				globalCallbacks.onRetrySuccess && globalCallbacks.onRetrySuccess( hash, reqClone, response);
				return this.doFetch( index + 1); 
			})
			.catch (e => {
				
				globalCallbacks.onRetryFailure && globalCallbacks.onRetryFailure( hash, reqClone, e );
				return this.doFetch( index + 1);
			});
	}

	// takes a request and gives back JSON object that is storable in IDB
	async getQueueableRequest(request, config){
		let bodyText = await request.text();
		return {
			request:{
				url: request.url,
				headers: JSON.stringify(request.headers),
				body: bodyText,
				mode: request.mode,
				method: request.method,
				redirect: request.redirect
			},
			config: config,
			metadata:{
				creationTimestamp: Date.now()
			}
		};
	}

}


const reqManager = new RequestManager();

export default reqManager;