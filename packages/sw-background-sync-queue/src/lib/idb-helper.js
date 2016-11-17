import IDBHelper from '../../../../lib/idb-helper';
import {defaultDBName} from './constants';

let idbQHelper = new IDBHelper(defaultDBName, 1, 'QueueStore');

function initDb(dbName){
	idbQHelper = new IDBHelper(defaultDBName, 1, 'QueueStore');
}

function getDb(){
	return idbQHelper;
}
export {
	initDb,
	getDb,
};
