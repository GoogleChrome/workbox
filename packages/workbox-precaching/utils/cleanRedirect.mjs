/**
 * @param {Response} response
 * @return {Response}
 *
 * @private
 * @memberof module:workbox-precachig
 */
const cleanRedirect = async (response) => {
  const clonedResponse = response.clone();

  // Not all browsers support the Response.body stream, so fall back
  // to reading the entire body into memory as a blob.
  const bodyPromise = 'body' in clonedResponse ?
    Promise.resolve(clonedResponse.body) :
    clonedResponse.blob();

  const body = await bodyPromise;

  // new Response() is happy when passed either a stream or a Blob.
  return new Response(body, ['headers', 'status', 'statusText'].map((key) => {
      return clonedResponse[key];
    })
  );
};

export default cleanRedirect;
