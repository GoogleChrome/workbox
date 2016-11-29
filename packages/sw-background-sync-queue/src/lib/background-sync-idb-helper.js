import IDBHelper from '../../../../lib/idb-helper';
import {defaultDBName} from './constants';

let idbQHelper;
let queueObject = {};


function initDb(dbName) {
	queueObject = {};
	idbQHelper = new IDBHelper(dbName || defaultDBName, 1, 'QueueStore');
}

function getDb() {
	return idbQHelper;
}

async function initQueue() {
	queueObject = await idbQHelper.get('queue') || queueObject;
}

function getQueue(queueName) {
	return queueObject[queueName];
}

function createQueue(queueName) {
	queueObject[queueName] = [];
	return queueObject[queueName];
}

async function setIdbQueue(queueName, queue) {
	queueObject[queueName] = queue;
	await idbQHelper.put('queue', queueObject);
}

export {
	initDb,
	getDb,
	initQueue,
	getQueue,
	setIdbQueue,
	createQueue,
};
