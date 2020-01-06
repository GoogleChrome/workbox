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

app.get('/api/date', function(req, res) {
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'no-cache');
  res.send(`Received from the server at ${new Date().toLocaleString()}`);
});