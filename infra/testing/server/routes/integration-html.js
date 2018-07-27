const path = require('path');

const match = '/*/integration.html';

async function handler(req, res) {
  const filePath = path.join(__dirname, '..', 'static', 'integration.html');
  res.sendFile(filePath);
}

module.exports = {
  handler,
  match,
};
