import {getDbName} from './background-sync-idb-helper';
import IDBHelper from '../../../../lib/idb-helper';

async function putResponse({hash, idbObject, response, idbQDb}) {
	const _idbQHelper = idbQDb;
	idbObject.response = {
		headers: JSON.stringify([...response.headers]),
		status: response.status,
		body: await response.blob(),
	};
	_idbQHelper.put(hash, idbObject);
}

async function getResponse(hash) {
	const _idbQHelper = new IDBHelper(getDbName(), 1, 'QueueStore');
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
