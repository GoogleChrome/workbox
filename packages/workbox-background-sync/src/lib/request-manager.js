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
   * function to start playing requests
   * in sequence
   * @return {void}
   *
   * @memberOf RequestManager
   * @private
   */
  async replayRequests() {
    let allRequestsStatus = [];
    await this._queue.queue.reduce((promise, hash) => {
      return promise
        .then(async (item) => {
          const reqData = await this._queue.getRequestFromQueue({hash});
          if(reqData.response) {
            // check if request is not played already
            return;
          }

          const request = await getFetchableRequest({
            idbRequestObject: reqData.request,
          });

          return fetch(request)
            .then((response)=>{
              if(!response.ok) {
                allRequestsStatus.push(Promise.reject());
                return Promise.resolve();
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
                allRequestsStatus.push(Promise.resolve());
              }
            })
            .catch((err)=>{
              allRequestsStatus.push(Promise.reject());
              this._globalCallbacks.onRetryFailure
                && this._globalCallbacks.onRetryFailure(hash, err);
            });
        });
    }, Promise.resolve());
    return Promise.all(allRequestsStatus);
  }
}

export default RequestManager;
