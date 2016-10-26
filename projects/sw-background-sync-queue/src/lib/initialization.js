import { initializationDefaults } from './constants.js'; 
import queue from './queue';

let globalConfig = initializationDefaults;

async function initialize(config){
	globalConfig = Object.assign({}, initializationDefaults, config);
	attachSyncHandler();
	//TODO: call IDB cleanup.
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