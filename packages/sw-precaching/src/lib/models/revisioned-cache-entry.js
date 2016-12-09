import {cacheBustParamName} from '../constants';

class RevisionedCacheEntry {
  constructor({revisionID, revision, request, cacheBust}) {
    this.revisionID = revisionID;
    this.revision = revision;
    this.request = request;
    this.cacheBust = cacheBust;
  }

  get cacheBustRequest() {
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
    const parsedURL = new URL(requestURL, location.origin);
    parsedURL.search += (parsedURL.search ? '&' : '') +
      encodeURIComponent(cacheBustParamName) + '=' +
      encodeURIComponent(revision);
    return parsedURL.toString();
  }
}

export default RevisionedCacheEntry;
