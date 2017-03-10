import IDBHelper from '../../../../lib/idb-helper';
import {getDbName} from './background-sync-idb-helper';
import {allQueuesPlaceholder} from './constants';
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
 * @private
 */
async function getQueueableRequest({request, config}) {
	let requestObject={
		config,
		metadata: {
			creationTimestamp: Date.now(),
		},
	};
	requestObject.request = {
		url: request.url,
		headers: JSON.stringify([...request.headers]),
		mode: request.mode,
		method: request.method,
		redirect: request.redirect,
		credentials: request.credentials,
	};
	const requestBody = await request.text();
	if (requestBody.length > 0) {
		requestObject.request.body = requestBody;
	}
	return requestObject;
}

/**
 * takes an object and return a Request object to be executed by
 * the browser
 * @param {Object} idbRequestObject
 * @return {Request}
 * @private
 */
async function getFetchableRequest({idbRequestObject}) {
	let reqObject = {
		mode: idbRequestObject.mode,
		method: idbRequestObject.method,
		redirect: idbRequestObject.redirect,
		headers: new Headers(JSON.parse(idbRequestObject.headers)),
		credentials: idbRequestObject.credentials,
	};
	if(idbRequestObject.body) {
		reqObject.body = idbRequestObject.body;
	}
	return new Request(idbRequestObject.url, reqObject);
}

/**
 * clean up the queue, deleting all the tasks who are either damaged or
 * whose maxAge has expired
 *
 * @memberOf Queue
 * @private
 * @return {Promise}
 */
async function cleanupQueue() {
	let db = new IDBHelper(getDbName(), 1, 'QueueStore');
	let queueObj = await db.get(allQueuesPlaceholder);

	if(!queueObj) {
		return null;
	}

	await Promise.all(queueObj.map(async (queueName)=>{
		const requestQueues = await db.get(queueName);
		let itemsToKeep = [];
		let deletionPromises = [];
		await Promise.all(requestQueues.map( async (hash) => {
			const requestData = await db.get(hash);
			if (requestData && requestData.metadata
				&& requestData.metadata.creationTimestamp + requestData.config.maxAge
					<= Date.now()) {
				// Delete items that are too old.
				deletionPromises.push(db.delete(hash));
			} else {
				// Keep elements whose definition exists in idb.
				itemsToKeep.push(hash);
			}
		}));
		await Promise.all(deletionPromises);
		db.put(queueName, itemsToKeep);
	}));
}

export {
	getQueueableRequest,
	getFetchableRequest,
	cleanupQueue,
};
