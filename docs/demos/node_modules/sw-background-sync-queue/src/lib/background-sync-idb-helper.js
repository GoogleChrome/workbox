import {defaultDBName} from './constants';

let _dbName = defaultDBName;

function setDbName(dbName) {
	_dbName = dbName || defaultDBName;
}

function getDbName() {
	return _dbName;
}

export {
	setDbName,
	getDbName,
};
