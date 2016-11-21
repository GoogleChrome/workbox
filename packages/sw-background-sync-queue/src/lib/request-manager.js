import {maxAge} from './constants';
import Queue from './queue.js';
import {putResponse} from './response-manager';

let globalCallbacks = {};
let queue;
/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class
 */
class RequestManager {
	/**
	 * Initializes the request manager
	 * stores the callbacks object, maintins config and
	 * attaches event handler
	 * @param {any} {config, callbacks}
	 *
	 * @memberOf RequestManager
	 */
	constructor({config, callbacks}) {
		globalCallbacks = callbacks;
		queue = new Queue(Object.assign({}, {maxAge: maxAge}, config));
		this.attachSyncHandler();
	}
	/**
	 * @memberOf RequestManager
	 */
	async initialize() {
		await queue.initialize();
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
	 * @return {void}
	 *
	 * @memberOf RequestManager
	 */
	replayRequests() {
		return queue.queue.reduce((promise, hash) => {
			return promise
				.then(async (item) => {
					let reqData = await queue.getRequestFromQueue(hash);
					if(reqData.response) {
						// check if request is not played already
						return;
					}

					let request = await getFetchableRequest(reqData.request);
					return fetch(request)
						.then((response)=>{
							if(!response.ok) {
								Promise.resolve();
							} else {
								putResponse(hash, reqData, response.clone());
								globalCallbacks.onRetrySuccess
									&& globalCallbacks.onRetrySuccess(hash, response);
							}
						})
						.catch((err)=>{
							globalCallbacks.onRetryFailure
								&& globalCallbacks.onRetryFailure(hash, err);
						});
				});
		}, Promise.resolve());
	}

	pushIntoQueue({request, config}) {
		queue.push({request, config});
	}
}

/**
 * takes a request and gives back JSON object that is storable in IDB
 *
 * @param {Request} request request object to transform
 * into iDB storable object
 * @param {Object} config config object to be
 * stored along in the iDB
 * @return {Object} indexable object for iDB
 *
 * @memberOf RequestManager
 */
async function getQueueableRequest(request, config) {
	let requestObject={
		config: config,
		metadata: {
			creationTimestamp: Date.now(),
		},
	};
	let headerObject = {};
	request.headers.forEach((value, field)=> {
		headerObject[field] = value;
	});
	requestObject.request = {
		url: request.url,
		headers: headerObject,
		mode: request.mode,
		method: request.method,
		redirect: request.redirect,
	};
	let requestBody = await request.text();
	if (requestBody.length > 0) {
		requestObject.request.body = requestBody;
	}
	return requestObject;
}

async function getFetchableRequest(idbRequestObject) {
	let reqObject = {
		mode: idbRequestObject.mode,
		method: idbRequestObject.method,
		redirect: idbRequestObject.redirect,
		headers: new Headers(idbRequestObject.headers),
	};
	if(idbRequestObject.body) {
		reqObject.body = idbRequestObject.body;
	}
	return new Request(idbRequestObject.url, reqObject);
}

export default RequestManager;
export {
	getQueueableRequest,
};
