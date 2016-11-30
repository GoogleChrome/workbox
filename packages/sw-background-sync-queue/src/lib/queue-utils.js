import {getDb} from './background-sync-idb-helper';

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
	};
	let requestBody = await request.text();
	if (requestBody.length > 0) {
		requestObject.request.body = requestBody;
	}
	return requestObject;
}

async function getFetchableRequest({idbRequestObject}) {
	let reqObject = {
		mode: idbRequestObject.mode,
		method: idbRequestObject.method,
		redirect: idbRequestObject.redirect,
		headers: new Headers(JSON.parse(idbRequestObject.headers)),
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
 */
async function cleanupQueue() {
	const deletionPromises = [];
	let db = getDb();
	let queueObj = await db.get('queue');

	if(!queueObj) {
		return null;
	}

	for(const taskQueue in queueObj) {
		if (queueObj.hasOwnProperty(taskQueue)) {
			let itemsToKeep = [];
			for (const hash of queueObj[taskQueue]) {
				let requestData = await db.get(hash);
				if (requestData && requestData.metadata &&
						requestData.metadata.creationTimestamp
						+ requestData.config.maxAge <= Date.now()) {
						// Delete items that are too old.
						deletionPromises.push(db.delete(hash));
				} else if (requestData) {
					// Keep elements whose definition exists in idb.
					itemsToKeep.push(hash);
				}
			}
			queueObj[taskQueue] = itemsToKeep;
		}
	}

	await Promise.all(deletionPromises);
	db.put('queue', queueObj);
}

export {
	getQueueableRequest,
	getFetchableRequest,
	cleanupQueue,
};
