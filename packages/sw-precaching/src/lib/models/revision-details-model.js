import IDBHelper from '../../../../../lib/idb-helper.js';
import {dbName, dbVersion, dbStorename} from '../constants';

class RevisionDetailsModel {
  constructor() {
    this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename);
  }

  /**
   * This method gets the revision details for a given revisionID.
   * @param {String} revisionID The ID of the revision.
   * @return {Promise<String|null>} Returns a string for the last revision or
   * returns null if there is no revision information.
   */
  get(revisionID) {
    return this._idbHelper.get(revisionID);
  }

  /**
   * This method saves the revision details to indexedDB.
   * @param {String} revisionID The ID of the revision.
   * @param {String} revision The current revision for this revisionID.
   * @return {Promise} Promise that resolves once the data has been saved.
   */
  put(revisionID, revision) {
    return this._idbHelper.put(revisionID, revision);
  }

  /**
   * This method closes the indexdDB helper.
   */
  _close() {
    this._idbHelper.close();
  }
}

export default RevisionDetailsModel;
