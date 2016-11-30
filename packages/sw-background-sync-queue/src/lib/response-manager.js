import {getDb} from './background-sync-idb-helper';

async function putResponse(hash, idbObject, response) {
	let _idbQHelper = getDb();
	idbObject.response = {
		headers: JSON.stringify([...response.headers]),
		status: response.status,
		body: await response.blob(),
	};
	_idbQHelper.put(hash, idbObject);
}

async function getResponse(hash) {
	let _idbQHelper = getDb();
	let object = _idbQHelper.get(hash);
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
