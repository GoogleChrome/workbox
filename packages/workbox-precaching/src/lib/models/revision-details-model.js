import IDBHelper from '../../../../../lib/idb-helper.js';
import {dbName, dbVersion, dbStorename} from '../constants';

/**
 * This class is a simple model that stores EntryID's with their current
 * revision. This is used when caching revisioned assets so that only entries
 * with different revisions are downloaded and updated.
 *
 * @private
 * @memberof module:workbox-precaching
 */
class RevisionDetailsModel {
  /**
   * Constructor for RevisionDetails Model.
   */
  constructor() {
    this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);
  }

  /**
   * This method gets the revision details for a given entryID.
   * @param {String} entryID The ID of the revision.
   * @return {Promise<String|null>} Returns a revision string or
   * null if there is no revision information.
   */
  get(entryID) {
    return this._idbHelper.get(entryID);
  }

  /**
   * This method saves the revision details to indexedDB.
   * @param {String} entryID The ID of the revision.
   * @param {String} revision The current revision for this entryID.
   * @return {Promise} Promise that resolves once the data has been saved.
   */
  put(entryID, revision) {
    return this._idbHelper.put(entryID, revision);
  }

  /**
   * This method deletes the revision details from indexedDB for a given entry.
   * @param {String} entryID The ID of the revision.
   * @return {Promise} Promise that resolves once the data has been deleted.
   */
  delete(entryID) {
    return this._idbHelper.delete(entryID);
  }

  /**
   * This method closes the indexdDB helper. This is only used for unit testing
   * to ensure clean state between tests.
   *
   * @private
   */
  _close() {
    this._idbHelper.close();
  }
}

export default RevisionDetailsModel;
