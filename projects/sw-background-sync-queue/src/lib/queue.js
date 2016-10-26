import stringHash from 'string-hash';
import IDBHelper from '../../../../lib/idb-helper';

let _queue;
const idbQHelper = new IDBHelper("bgQueueSyncDB",1,"QueueStore");

class Queue {
	constructor(){
		this.initialize();
	}

	async initialize(){
		_queue = await idbQHelper.get("queue") || [];
	}

	async push(request, config){
		let hash = stringHash(request.url + JSON.stringify(request.headers) + await request.text() + Date.now());
		_queue.push(hash);

		//add to queue
		idbQHelper.put("queue", _queue);
		idbQHelper.put(hash, {
			request:{
				url: request.url,
				headers: JSON.stringify(request.headers),
				body: await request.text(),
				mode: request.mode,
				method: request.method,
				redirect: request.redirect
			},
			config: config,
			metadata:{
				attemptsDone: 0,
				creationTimestamp: Date.now()
			}
		});

		//register sync
		self.registration.sync.register("bgqueue");
	}

	replayRequests(){
		return idbQHelper.get("queue").then(queue => {
			if (queue.length < 1){
				return ;
			}
			
			return doFetch(0);
		});
	}
}

async function doFetch(index){
	if(!_queue[index])
		return;
	var req = await getRequestFromQueueAtIndex(index);
	console.log(req);
	return fetch( req )
		.then( r => r.json() )
		.then( data =>{
			//TODO: put data in idb
			console.log(data);
			return doFetch( index + 1);
		})
		.catch (e => {
			doFetch( index + 1);
		});
}

async function getRequestFromQueueAtIndex( index ){
	let hash = _queue[index];
	let reqData = await idbQHelper.get(hash);

	let request = new Request(reqData.request.url,{
		method: reqData.request.method,
		headers: JSON.parse(reqData.request.headers)
	});

	if(request.method === "POST"){
		request.body = reqData.request.body;
	}

	return request;
}

const queue = new Queue();

export default queue;