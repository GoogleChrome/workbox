export default class PrecacheEntry {
/**
 * This class ensures all cache list entries are consistent and
 * adds cache busting if required.
 * @param {*} originalInput
 * @param {string} entryId
 * @param {string} revision
 * @param {Request} request
 * @param {Boolean} cacheBust
 */
  constructor(originalInput, entryId, revision, request, cacheBust) {
    this._originalInput = originalInput;
    this._entryId = entryId;
    this._revision = revision;
    this._cacheRequest = request;
    this._networkRequest = cacheBust ?
      this._cacheBustRequest(request) : request;
  }

  /**
   * This method will either use Request.cache option OR append a cache
   * busting parameter to the URL.
   * @param {Request} request The request to cache bust
   * @return {Request} A cachebusted Request
   */
  _cacheBustRequest(request) {
    let url = request.url;
    const requestOptions = {};
    if ('cache' in Request.prototype) {
      // Make use of the Request cache mode where we can.
      // Reload skips the HTTP cache for outgoing requests and updates
      // the cache with the returned reponse.
      requestOptions.cache = 'reload';
    } else {
      const parsedURL = new URL(url, location);
      parsedURL.search += (parsedURL.search ? '&' : '') +
        encodeURIComponent(`_workbox-precaching`) + '=' +
        encodeURIComponent(this._revision);
      url = parsedURL.toString();
    }

    return new Request(url, requestOptions);
  }
}
