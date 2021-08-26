const express = require('express');
const app = express();
const path = require('path');

app.get('/', (request, response) => {
  response.sendFile(path.resolve('index.html'));
});

app.get('/sw-1.js', (request, response) => {
  response.sendFile(path.resolve('sw-1.js'));
});

app.get('/sw-2.js', (request, response) => {
  response.sendFile(path.resolve('sw-2.js'));
});

app.use(express.static('public'));

/* /////////////////////////////////////////////////////////////////////////////
 The code below this comment is unrelated to the demo and used for maintenance
 vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
/////////////////////////////////////////////////////////////////////////////*/

const {execSync} = require('child_process');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post('/deploy', (request, response) => {
  if (request.query.secret !== process.env.SECRET) {
    response.status(401).send();
    return;
  }

  const repoUrl = request.query.repo;
  execSync(
    `git checkout -- ./ && git pull -X theirs ${repoUrl} ` +
      `glitch && refresh && git branch -D glitch`,
  );
  response.status(200).send();
});

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
