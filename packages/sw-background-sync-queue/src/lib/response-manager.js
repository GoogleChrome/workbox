import idbQHelper from './idb-helper';

class ResponseManager {
	async putResponse(hash, idbObject, response) {
		idbObject.response = {
			headers: JSON.stringify(response.headers),
			status: response.status,
			body: await response.blob(),
		};
		idbQHelper.put(hash, idbObject);
	}
	getResponse(reqId) {
	}
}

const resManager = new ResponseManager();
export default resManager;
