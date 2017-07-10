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
   * @private
   */
  attachSyncHandler() {
    self.addEventListener('sync', (event) => {
      if (event.tag === tagNamePrefix + this._queue.queueName
        || event.tag === replayAllQueuesTag) {
        event.waitUntil(this.replayRequests());
      }
    });
  }

  /**
   * function to play one single request given its hash
   *
   * @param {String} hash
   *
   * @return {Promise} Resolves if the request corresponding to the hash is
   * played successfully, rejects if it fails during the replay
   *
   *
   * @private
   */
  async replayRequest(hash) {
    try {
      const reqData = await this._queue.getRequestFromQueue({hash});
      if (reqData.response) {
        return;
      }
      const request = await getFetchableRequest({
        idbRequestObject: reqData.request,
      });
      const response = await fetch(request);
      if (!response.ok) {
        return Promise.reject(response);
      } else {
        // not blocking on putResponse.
        putResponse({
          hash,
          idbObject: reqData,
          response: response.clone(),
          idbQDb: this._queue.idbQDb,
        });
        if (this._globalCallbacks.onResponse) {
          this._globalCallbacks.onResponse(hash, response);
        }
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * This function is to be called to replay all the requests
   * in the current queue. It will play all the requests and return a promise
   * based on the successfull execution of the requests.
   *
   * @return {Promise} Resolves if all requests are played successfully,
   * rejects if any of the request fails during the replay
   *
   * @private
   */
  async replayRequests() {
    const failedItems = [];
    for (let hash of this._queue.queue) {
      try {
        await this.replayRequest(hash);
      } catch (err) {
        if (this._globalCallbacks.onRetryFailure) {
          this._globalCallbacks.onRetryFailure(hash, err);
        }
        failedItems.push(err);
      }
    }
    return failedItems.length > 0 ?
      Promise.reject(failedItems) : Promise.resolve();
  }
}

export default RequestManager;
