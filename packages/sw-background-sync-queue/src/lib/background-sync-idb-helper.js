import {defaultDBName} from './constants';
import assert from '../../../../lib/assert';

let _dbName = defaultDBName;

function setDbName(dbName) {
	assert.isType({dbName}, 'string');
	_dbName = dbName;
}

function getDbName() {
	return _dbName;
}

export {
	setDbName,
	getDbName,
};
