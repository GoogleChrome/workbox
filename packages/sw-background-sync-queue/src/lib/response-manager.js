import idbQHelper from './idb-helper';

async function putResponse(hash, idbObject, response) {
	idbObject.response = {
		headers: JSON.stringify(response.headers),
		status: response.status,
		body: await response.blob(),
	};
	idbQHelper.put(hash, idbObject);
}

export {
	putResponse,
};
