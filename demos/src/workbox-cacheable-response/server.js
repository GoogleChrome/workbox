// server.js
// where your node app starts

// init project
const express = require("express");
const app = express();

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/index.html");
});

app.get("/sw.js", function(request, response) {
  response.sendFile(__dirname + "/sw.js");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

app.get('/api/is-response-cacheable',
    function(req, res) {
      if (req.headers['x-is-cacheable']) {
        const value = req.headers['x-is-cacheable'];
        res.set('X-Is-Cacheable', value);
        res.send(`This response has 'X-Is-Cacheable' header set to '${value}'`);
      } else {
        res.send(`This response has no 'X-Is-Cacheable' header`);
      }
    }
);