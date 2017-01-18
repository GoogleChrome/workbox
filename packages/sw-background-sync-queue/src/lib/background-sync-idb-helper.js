import {defaultDBName} from './constants';
import assert from '../../../../lib/assert';

let _dbName = defaultDBName;

/**
 * sets the dbName, which is used to store the queue and requests
 * defaults to bgQueueSyncDB
 * @param {String} dbName
 * @private
 */
function setDbName(dbName) {
	assert.isType({dbName}, 'string');
	_dbName = dbName;
}

/**
 * return the already set indexed db name
 * @return {String}
 * @private
 */
function getDbName() {
	return _dbName;
}

export {
	setDbName,
	getDbName,
};
