const match = '/__WORKBOX/uniqueValue';

let counter = 0;
async function handler(ctx) {
  ctx.body = `Unique value is ${counter++}.`;
}

module.exports = {
  handler,
  match,
};
