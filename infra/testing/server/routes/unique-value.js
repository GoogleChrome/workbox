const match = '/__WORKBOX/uniqueValue';

let counter = 0;
async function handler(req, res) {
  res.send(`Unique value is ${counter++}.`);
}

module.exports = {
  handler,
  match,
};
