import { initializationDefaults } from './constants.js'; 
import queue from './queue';

let globalConfig = initializationDefaults;

async function initialize(config){
	globalConfig = Object.assign({}, initializationDefaults, config);
	await queue.initialize();
	await queue.cleanupQueue();
	attachSyncHandler();
}

function attachSyncHandler(){
	//TODO: implement this
	self.addEventListener('sync',e=>{
		//console.log("Got fetch with config:",globalConfig);
		//start replaying here
		return queue.replayRequests();
	});
}

export default initialize ;
export { queue };