import {putResponse} from './response-manager';
import {getFetchableRequest} from './queue-utils';
import {tagNamePrefix} from './constants';
import RequestQueue from './request-queue';
import assert from '../../../../lib/assert';

/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class
 */
class RequestManager {
	/**
	 * Initializes the request manager
	 * stores the callbacks object, maintains config and
	 * attaches event handler
	 * @param {any} {callbacks, queue}
	 *
	 * @memberOf RequestManager
	 */
	constructor({callbacks, queue}) {
		assert.isInstance({queue}, RequestQueue);

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
			if(event.tag === tagNamePrefix + this._queue.queueName) {
				event.waitUntil(this.replayRequests());
			}
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
					const reqData = await this._queue.getRequestFromQueue({hash});
					if(reqData.response) {
						// check if request is not played already
						return;
					}

					const request = await getFetchableRequest({
						idbRequestObject: reqData.request,
					});

					return fetch(request)
						.then((response)=>{
							if(!response.ok) {
								return Promise.resolve();
							} else {
								// not blocking on putResponse.
								putResponse({
									hash,
									idbObject: reqData,
									response: response.clone(),
									idbQDb: this._queue.idbQDb,
								});
								this._globalCallbacks.onResponse
									&& this._globalCallbacks.onResponse(hash, response);
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

export default RequestManager;
