import {cacheBustParamName} from '../../constants';

class BaseCacheEntry {
  constructor({entryID, revision, request, cacheBust}) {
    this.entryID = entryID;
    this.revision = revision;
    this.request = request;
    this.cacheBust = cacheBust;
  }

  getNetworkRequest() {
    return new Request(this._cacheBustUrl(this.request.url, this.revision));
  }

  /**
   * This method takes a file entry and if the `cacheBust` parameter is set to
   * true, the cacheBust parameter will be added to the URL before making the
   * request. The response will be cached with the absolute URL without
   * the cache busting search param.
   * @param {String} requestURL This is an object with `url`, `revision` and
   * `cacheBust` parameters.
   * @param {String} revision Revision to use in the cache bust.
   * @return {String} The final URL to make the request to then cache.
   */
  _cacheBustUrl(requestURL, revision) {
    if (this.cacheBust !== true) {
      return requestURL;
    }

    if ('cache' in Request.prototype) {
      // Make use of the Request cache mode where we can.
      // Reload skips the HTTP cache for outgoing requests and updates
      // the cache with the returned reponse.
      return new Request(requestURL, {cache: 'reload'});
    }

    const parsedURL = new URL(requestURL, location);
    parsedURL.search += (parsedURL.search ? '&' : '') +
      encodeURIComponent(cacheBustParamName) + '=' +
      encodeURIComponent(revision);
    return parsedURL.toString();
  }
}

export default BaseCacheEntry;
