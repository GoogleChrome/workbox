import IDBHelper from '../../../../lib/idb-helper';

/**
 * Puts the fetched response in the IDB
 *
 * @param {Object} config
 * @private
 */
async function putResponse({hash, idbObject, response, idbQDb}) {
	const _idbQHelper = idbQDb;
	idbObject.response = {
		headers: JSON.stringify([...response.headers]),
		status: response.status,
		body: await response.blob(),
	};
	_idbQHelper.put(hash, idbObject);
}

/**
 * This function returns the fetched response for the given id of the request
 *
 * @memberof module:workbox-background-sync
 *
 * @param {String} id The ID of the request given back by the broaadcast
 * channel
 * @return {Object} response Fetched response of the request.
 */
async function getResponse({id, dbName}) {
	const _idbQHelper = new IDBHelper(dbName, 1, 'QueueStore');
	const object = await _idbQHelper.get(id);
	if (object && object.response) {
		return object.response;
	} else {
		return null;
	}
}

export {
	putResponse,
	getResponse,
};
