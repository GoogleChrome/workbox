const path = require('path');
const send = require('koa-send');

const match = '/*/integration.html';

async function handler(ctx) {
  const root = path.resolve(__dirname, '..', 'static');
  await send(ctx, 'integration.html', {root});
}

module.exports = {
  handler,
  match,
};
