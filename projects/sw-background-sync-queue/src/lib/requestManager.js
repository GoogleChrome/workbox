import { initializationDefaults } from './constants';
import queue from './queue.js';

let globalConfig = initializationDefaults;
let callbacks = {};

class RequestManager{
	async initialize(config, callbacks){
		this.attachSyncHandler();
		globalConfig = Object.assign({}, initializationDefaults, config);
		callbacks = callbacks;
		await queue.initialize( globalConfig, callbacks );
		//await queue.cleanupQueue();
	}

	attachSyncHandler(){
		self.addEventListener('sync', e => {
			this.replayRequests().then(e=>{
				console.log("done");
			})
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
		if(!reqData){
			return;
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
				//putResponse(response.clone());
				//callbacks.onRetrySuccess && callbacks.onRetrySuccess( reqClone, response);
				return this.doFetch( index + 1); 
			})
			.catch (e => {
				callbacks.onRetryFailure && callbacks.onRetryFailure( reqClone, e );
				console.log("calling from fetch", index, e);
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
				attemptsDone: 0,
				creationTimestamp: Date.now()
			}
		};
	}

}


const reqManager = new RequestManager();

export default reqManager;