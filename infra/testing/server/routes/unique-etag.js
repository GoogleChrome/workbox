const match = '/__WORKBOX/uniqueETag';

let counter = 0;
async function handler(ctx) {
  ctx.set('ETag', ++counter);
  ctx.body = `ETag is ${counter}.`;
}

module.exports = {
  handler,
  match,
};
