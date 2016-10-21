import { initializationDefaults } from './constants';

let globalConfig = initializationDefaults;
function initialize(config){
	initializationDefaults = Object.assign({}, initializationDefaults, config);
	attachSyncHandler();	
}

function attachSyncHandler(){
	self.addEventListener('sync',e=>{
		console.log("Got fetch with config:",globalConfig);
	});
}


export default initialize;