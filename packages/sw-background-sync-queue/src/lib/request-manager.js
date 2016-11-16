import {maxAge} from './constants';
import Queue from './queue.js';
import {putResponse} from './response-manager';

let globalConfig = {
	maxAge: maxAge
};

let globalCallbacks = {};
let queue;
/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class RequestManager
 */
class RequestManager {
	constructor({config, callbacks}){
		globalConfig = Object.assign({}, globalConfig, config);
		globalCallbacks = callbacks;
		queue = new Queue(globalConfig);
		this.attachSyncHandler();
	}
	/**
	 * Initializes the request manager
	 * stores the callbacks object, maintins config and
	 * attaches event handler
	 * @param {Object} config config that gives values like
	 * maxAge of requests in iDB
	 * @param {Object} callbacks object that contains function
	 * ref for various lifecycle callbacks
	 *
	 * @memberOf RequestManager
	 */
	async initialize() {
		await queue.initialize( globalConfig );
		await queue.cleanupQueue();
	}

	/**
	 * attaches sync handler to replay requests when
	 * sync event is fired
	 *
	 * @memberOf RequestManager
	 */
	attachSyncHandler() {
		self.addEventListener('sync', (event) => {
			event.waitUntil(this.replayRequests());
		});
	}

	/**
	 * function to start playing requests
	 * in sequence
	 * @return {Promise} promise that will resolve whenn all requests complete
	 *
	 * @memberOf RequestManager
	 */
	replayRequests() {
		if (queue.getTotalTasks() < 1) {
			return;
		}
		return this.doFetch(0);
	}

	/**
	 * takes starting index and play all then
	 * requests from that index onwards till the end
	 *
	 * @param {int} index starting point of playing
	 * @return {void}
	 *
	 * @memberOf RequestManager
	 */
	async doFetch(index) {
		let reqData = await queue.getRequestFromQueueAtIndex(index);
		let hash = queue.getHash(index);
		// exit point
		if(!reqData) {
			return;
		}

		// proceed if response do not already exist
		if(reqData.response) {
			return this.doFetch(index + 1);
		}

		let request = await getFetchableRequest(reqData.request);

		return fetch(request)
			.then( (response) => {
				putResponse(hash, reqData, response.clone());
				globalCallbacks.onRetrySuccess
					&& globalCallbacks.onRetrySuccess(hash, response);
				return this.doFetch(index + 1);
			})
			.catch((err) => {
				globalCallbacks.onRetryFailure
					&& globalCallbacks.onRetryFailure(hash, err);
				return this.doFetch( index + 1);
			});
	}

	pushIntoQueue(request, config){
		queue.push(request, config)
	}
}

/**
 * takes a request and gives back JSON object that is storable in IDB
 *
 * @param {Request} request request object to transform
 * into iDB storable object
 * @param {Object} config config object to be
 * stored along inthe iDB
 * @return {Object} indexable object for iDB
 *
 * @memberOf RequestManager
 */
async function getQueueableRequest(request, config) {
	let requestObject={
		config: config,
		metadata: {
			creationTimestamp: Date.now(),
		}
	}
	let headerObject = {};
	request.headers.forEach((value,field)=>{
		headerObject[field] = value;
	});
	requestObject.request = {
		url: request.url,
		headers: headerObject,
		mode: request.mode,
		method: request.method,
		redirect: request.redirect,
	};
	if(request.body){
		requestObject.request.body = await request.blob();
	}
	return requestObject;
}

async function getFetchableRequest(idbRequestObject){
	let request = new Request(idbRequestObject.url, {
			mode: idbRequestObject.mode,
			method: idbRequestObject.method,
			redirect: idbRequestObject.redirect,
			headers: new Headers(idbRequestObject.headers)
	});
	if(idbRequestObject.body){
		request.body = idbRequestObject.body
	};

	return request;
}

export default RequestManager;
export {
	getQueueableRequest
};
