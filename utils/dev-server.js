const testServer = require('./test-server.js');
const path = require('path');

const serverPath = path.join(__dirname, '..');
testServer.startServer(serverPath, 8080).then((portNumber) => {
 console.log(`http://localhost:${portNumber}/`);
});
