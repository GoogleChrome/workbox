import { initializationDefaults } from './constants.js'; 
import queue from './queue';
import requestManager from './queue';

let globalConfig = initializationDefaults;

async function initialize(config, callbacks){
	globalConfig = Object.assign({}, initializationDefaults, config);
	
	
}

function attachSyncHandler(){
	self.addEventListener('sync',e=>{
		return requestManager.replayRequests();
	});
}

export default initialize ;
export { queue };