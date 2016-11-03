import { initializationDefaults } from './constants.js'; 
import queue from './queue';

let globalConfig = initializationDefaults;

async function initialize(config, callbacks){
	globalConfig = Object.assign({}, initializationDefaults, config);
	await queue.initialize( globalConfig, callbacks );
	await queue.cleanupQueue();
	attachSyncHandler();
}

function attachSyncHandler(){
	self.addEventListener('sync',e=>{
		return queue.replayRequests();
	});
}

export default initialize ;
export { queue };