const path = require('path');
const send = require('koa-send');

const match = '/__WORKBOX/comlink.js';

async function handler(ctx) {
  const comlinkMain = require.resolve('comlinkjs');
  const root = path.join(path.dirname(comlinkMain), 'umd');

  await send(ctx, 'comlink.js', {root});
}

module.exports = {
  handler,
  match,
};
