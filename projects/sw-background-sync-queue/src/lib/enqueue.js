import { initializationDefaults } from './constants';

export default function pushIntoQueue(request, options){
	let config = Object.assign({}, initializationDefaults, options);
	console.log(request, config);
}