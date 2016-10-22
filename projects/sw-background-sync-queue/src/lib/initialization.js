import { initializationDefaults } from './constants.js'; 

let globalConfig = initializationDefaults;
function initialize(config){
	globalConfig = Object.assign({}, initializationDefaults, config);
	attachSyncHandler();
	//TODO: call IDB cleanup.
}

function attachSyncHandler(){
	self.addEventListener('sync',e=>{
		console.log("Got fetch with config:",globalConfig);
		//start replaying here
	});
}

export default initialize ;