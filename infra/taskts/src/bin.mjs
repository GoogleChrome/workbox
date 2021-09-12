#!/usr/bin/env node
/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import execa from 'execa';
import path from 'path';
import url from 'url';

const currentScript = url.fileURLToPath(import.meta.url);
const pathToMain = path.join(path.dirname(currentScript), 'main.ts');

(async () => {
  try {
    const childProcess = execa('node', [
      // C.f. https://github.com/nodejs/node/issues/30810
      '--no-warnings',
      '--experimental-loader',
      'esbuild-node-loader',
      pathToMain,
      ...process.argv.slice(2),
    ]);
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
    await childProcess;
  } catch (err) {
    process.exit(err.exitCode);
  }
})();
