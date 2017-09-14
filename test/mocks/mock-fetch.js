global.fetch = async (request) => {
  const response = new Response('Response from test/mocks/mock-fetch.js', {
    status: 200,
    statusText: 'ok.',
  });
  response.url = request.url;
  return response;
};
