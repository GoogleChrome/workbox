import {getDb} from './background-sync-idb-helper';

async function putResponse(hash, idbObject, response) {
	const _idbQHelper = getDb();
	idbObject.response = {
		headers: JSON.stringify([...response.headers]),
		status: response.status,
		body: await response.blob(),
	};
	_idbQHelper.put(hash, idbObject);
}

async function getResponse(hash) {
	const _idbQHelper = getDb();
	const object = _idbQHelper.get(hash);
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
