const match = '/__WORKBOX/uniqueETag';

let counter = 0;
async function handler(req, res) {
  res.set('ETag', ++counter);
  res.send(`ETag is ${counter}.`);
}

module.exports = {
  handler,
  match,
};
