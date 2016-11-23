const swTestingHelpers = require('sw-testing-helpers');
const path = require('path');

const testServer = new swTestingHelpers.TestServer();
const serverPath = path.join(__dirname, '..', '..', '..', '..');
testServer.startServer(serverPath, 8080).then((portNumber) => {
 console.log(`http://localhost:${portNumber}/`);
});
