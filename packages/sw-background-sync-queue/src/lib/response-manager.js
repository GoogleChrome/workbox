import {getDb} from './background-sync-idb-helper';
let _idbQHelper = getDb();

async function putResponse(hash, idbObject, response) {
	idbObject.response = {
		headers: JSON.stringify(response.headers),
		status: response.status,
		body: await response.blob(),
	};
	_idbQHelper.put(hash, idbObject);
}

export {
	putResponse,
};
