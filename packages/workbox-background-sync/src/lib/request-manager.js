import {putResponse} from './response-manager';
import {getFetchableRequest} from './queue-utils';
import {tagNamePrefix, replayAllQueuesTag} from './constants';

/**
 * Class to handle all the request related
 * transformations, replaying, event handling
 * broadcasting back to controlled pages etc.
 * @class
 * @private
 */
class RequestManager {
  /**
   * Initializes the request manager
   * stores the callbacks object, maintains config and
   * attaches event handler
   * @param {Object=} config
   *
   * @memberOf RequestManager
   * @private
   */
  constructor({callbacks, queue}) {
    this._globalCallbacks = callbacks || {};
    this._queue = queue;
    this.attachSyncHandler();
  }

  /**
   * attaches sync handler to replay requests when
   * sync event is fired
   *
   * @memberOf RequestManager
   * @private
   */
  attachSyncHandler() {
    self.addEventListener('sync', (event) => {
      if(event.tag === tagNamePrefix + this._queue.queueName
        || event.tag === replayAllQueuesTag) {
        event.waitUntil(this.replayRequests());
      }
    });
  }

  /**
   * function to play one single request
   * given its hash
   * @param {String=} hash
   * @return {Promise}
   *
   * @memberOf RequestManager
   * @private
   */
  async replayRequest(hash) {
    try {
      const reqData = await this._queue.getRequestFromQueue({hash});
      const request = await getFetchableRequest({
        idbRequestObject: reqData.request});
      const response = await fetch(request);
      if(!response.ok) {
        return Promise.reject(response.status);
      } else {
        // not blocking on putResponse.
        putResponse({
          hash,
          idbObject: reqData,
          response: response.clone(),
          idbQDb: this._queue.idbQDb,
        });
        this._globalCallbacks.onResponse
          && this._globalCallbacks.onResponse(hash, response);
      }
    } catch(err) {
      this._globalCallbacks.onRetryFailure
        && this._globalCallbacks.onRetryFailure(hash, err);
      return Promise.reject(err);
    }
  }

  /**
   * function to start playing requests
   * in sequence
   * @return {Promise}
   *
   * @memberOf RequestManager
   * @private
   */
  async replayRequests() {
    let failedItems = [];
    for (let hash of this._queue.queue) {
      try {
        await this.replayRequest(hash);
      } catch (err) {
        failedItems.push(err);
        failedItems++;
      }
    }
    return failedItems.length > 0 ?
      Promise.reject(failedItems) : Promise.resolve();
  }
}

export default RequestManager;
