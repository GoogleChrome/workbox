/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const match = '/*/unique-with-message.html';

let count = 0;
async function handler(_, res) {
  res.set('Content-Type', 'text/html');
  res.set('Cache-Control', 'no-store');
  res.status(200).send(
    `<html>
      <head>
        <title>Unique HTML Response</title>
      <body>
        <p>This has been called ${++count} times.<p>
        <script>
          window.__messages = [];
          navigator.serviceWorker.addEventListener('message', (event) => {
            window.__messages.push(event.data);
          });
        </script>
      </body>
    </html>`,
  );
}

module.exports = {
  handler,
  match,
};
