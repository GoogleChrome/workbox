import {initializationDefaults} from './constants';
import queue from './queue.js';
import responseManager from './responseManager';
let globalConfig = initializationDefaults;
let globalCallbacks = {};

/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class RequestManager
 */
class RequestManager {
	/**
	 * Initializes the request manager
	 * stores the callbacks object, maintins global config and
	 * attaches event handler
	 * @param {Object} config config that gives values like
	 * maxAge of requests in iDB
	 * @param {Object} callbacks object that contains function
	 * ref for various lifecycle callbacks
	 *
	 * @memberOf RequestManager
	 */
	async initialize(config, callbacks) {
		this.attachSyncHandler();
		globalConfig = Object.assign({}, initializationDefaults, config);
		globalCallbacks = callbacks;
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

		let request = new Request(reqData.request.url, {
			method: reqData.request.method,
			headers: JSON.parse(reqData.request.headers),
		});

		if(request.method === 'POST') {
			request.body = reqData.request.body;
		}

		let reqClone = request.clone();
		return fetch( request )
			.then( (response) => {
				responseManager.putResponse(hash, reqData, response.clone());
				globalCallbacks.onRetrySuccess
					&& globalCallbacks.onRetrySuccess(hash, reqClone, response);
				return this.doFetch(index + 1);
			})
			.catch((err) => {
				globalCallbacks.onRetryFailure
					&& globalCallbacks.onRetryFailure(hash, reqClone, err);
				return this.doFetch( index + 1);
			});
	}

	// takes a request and gives back JSON object that is storable in IDB
	/**
	 * 
	 * 
	 * @param {any} request
	 * @param {any} config
	 * @return
	 * 
	 * @memberOf RequestManager
	 */
	async getQueueableRequest(request, config) {
		let bodyText = await request.text();
		return {
			request: {
				url: request.url,
				headers: JSON.stringify(request.headers),
				body: bodyText,
				mode: request.mode,
				method: request.method,
				redirect: request.redirect,
			},
			config: config,
			metadata: {
				creationTimestamp: Date.now(),
			},
		};
	}
}

const reqManager = new RequestManager();
export default reqManager;
