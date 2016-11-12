import IDBHelper from '../../../../lib/idb-helper';

let idbQueue;

(async function idbHelper(){
	let idbQHelper = new IDBHelper("bgQueueSyncDB",1,"QueueStore");
	idbQueue = await idbQHelper.get("queue");
})();


export { idbQueue };