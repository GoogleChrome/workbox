import IDBHelper from '../../../../lib/idb-helper';
import {defaultDBName, defaultQueueName} from './constants';

let idbQHelper;
let queueObject = {};


function initDb(dbName) {
	queueObject[defaultQueueName] =[];
	idbQHelper = new IDBHelper(dbName || defaultDBName, 1, 'QueueStore');
}

async function initQueue(){
	queueObject = await idbQHelper.get('queue') || queueObject;
}

function getDb() {
	return idbQHelper;
}

function getQueue(queueName) {
	return queueObject[queueName || defaultQueueName];
}

function createQueue(queueName){
	queueObject[queueName] = [];
	return queueObject[queueName];
}

async function setIdbQueue(queueName, queue){
	queueObject[queueName] = queue;
	await idbQHelper.put('queue',queueObject);
}

export {
	initDb,
	getDb,
	initQueue,
	getQueue,
	setIdbQueue,
	putRequest,
	createQueue
};
