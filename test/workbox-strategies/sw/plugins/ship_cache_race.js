import {Strategy} from 'workbox-strategies';

class CacheNetworkRace extends Strategy {
  _handle(request, handler) {
    const fetchAndCachePutDone = handler.fetchAndCachePut(request);
    const cacheMatchDone = handler.cacheMatch(request); 

    return new Promise((resolve, reject) => {
      fetchAndCachePutDone.then(resolve);
      cacheMatchDone.then((response) => response && resolve(response));

      // Reject if both network and cache error or find no response.
      Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then((results) => {
        const [fetchAndCachePutResult, cacheMatchResult] = results;
        if (fetchAndCachePutResult.status === 'rejected' && !cacheMatchResult.value) {
          reject(fetchAndCachePutResult.reason);
        }  
      });
    });
  }
}