import { initializationDefaults } from './constants';
import queue from './queue';

export default async function pushIntoQueue(request, options){
	let config = Object.assign({}, initializationDefaults, options);
	queue.push(request, config);
}

function createQueableTask(request){

}