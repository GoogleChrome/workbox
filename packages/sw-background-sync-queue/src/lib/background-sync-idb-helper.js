import {defaultDBName} from './constants';
import assert from '../../../../lib/assert';

let _dbName = defaultDBName;

/**
 * set the dbName to store the queue and requests
 * defaults to defaultDBName
 * @param {String} dbName
 */
function setDbName(dbName) {
	assert.isType({dbName}, 'string');
	_dbName = dbName;
}

/**
 * return the already set indexed db name
 * @return {String}
 */
function getDbName() {
	return _dbName;
}

export {
	setDbName,
	getDbName,
};
