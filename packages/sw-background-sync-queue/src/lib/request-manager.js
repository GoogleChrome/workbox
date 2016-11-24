import {putResponse} from './response-manager';

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
	 * @param {any} {callbacks, queue}
	 *
	 * @memberOf RequestManager
	 */
	constructor({callbacks, queue}) {
		this._globalCallbacks = callbacks || {};
		this._queue = queue;
		this.attachSyncHandler();
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
		return this._queue.queue.reduce((promise, hash) => {
			return promise
				.then(async (item) => {
					let reqData = await this._queue.getRequestFromQueue(hash);
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
								this._globalCallbacks.onRetrySuccess
									&& this._globalCallbacks.onRetrySuccess(hash, response);
							}
						})
						.catch((err)=>{
							this._globalCallbacks.onRetryFailure
								&& this._globalCallbacks.onRetryFailure(hash, err);
						});
				});
		}, Promise.resolve());
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
