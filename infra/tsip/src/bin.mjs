#!/usr/bin/env node
/*
  Copyright 2021 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import execa from 'execa';
import path from 'path';
import resolve from 'resolve';
import url from 'url';

const currentScript = url.fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentScript);
const pathToMain = path.join(currentDir, 'main.ts');
const pathToESBuildLoader = resolve.sync('esbuild-node-loader', {
  basedir: currentDir,
});

(async () => {
  try {
    const childProcess = execa('node', [
      // C.f. https://github.com/nodejs/node/issues/30810
      '--no-warnings',
      '--experimental-loader',
      pathToESBuildLoader,
      pathToMain,
      ...process.argv.slice(2),
    ], {
      stdout: 'inherit',
      stderr: 'inherit',
    });
    await childProcess;
  } catch (err) {
    process.exit(err.exitCode);
  }
})();
