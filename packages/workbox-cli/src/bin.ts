#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {pathToFileURL} from 'url';
import meow from 'meow';
import type UpdateNotifier from 'update-notifier';

import {app} from './app';
import {cleanupStackTrace} from './lib/cleanup-stack-trace.js';
import {helpText} from './lib/help-text';
import {logger} from './lib/logger';

export interface SupportedFlags extends meow.AnyFlags {
  debug: meow.BooleanFlag;
  injectManifest: meow.BooleanFlag;
  watch: meow.BooleanFlag;
}

// `update-notifier` v7 is ESM-only, while this package is compiled to
// CommonJS. `tsc` emits a static import of it as `require('update-notifier')`,
// which throws ERR_REQUIRE_ESM on Node 20.0 - 20.18, i.e. inside this
// package's own `engines` range (`require(esm)` is only enabled by default as
// of Node 20.19).
//
// Writing `await import('update-notifier')` here does not help: with
// `"module": "CommonJS"`, `tsc` downlevels it straight back into
// `Promise.resolve().then(() => require('update-notifier'))`. Building the
// `import()` at runtime is what keeps it out of that transform, so a real
// dynamic import survives in the emitted `build/bin.js`.
//
// See https://github.com/GoogleChrome/workbox/issues/3549
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const importModule = new Function('url', 'return import(url);') as (
  url: string,
) => Promise<{default: typeof UpdateNotifier}>;

void (async () => {
  const params: meow.Result<any> = meow(helpText);

  // `require.resolve()` only resolves the specifier to a path, it does not
  // load the module, so it is safe to call for an ESM-only package.
  const {default: updateNotifier} = await importModule(
    pathToFileURL(require.resolve('update-notifier')).href,
  );
  updateNotifier({pkg: params.pkg as UpdateNotifier.Package}).notify();

  try {
    await app(params);
  } catch (error) {
    if (error instanceof Error) {
      // Show the full error and stack trace if we're run with --debug.
      if (params.flags.debug) {
        if (error.stack) {
          logger.error(`\n${error.stack}`);
        }
      } else {
        logger.error(`\n${error.message}`);
        logger.debug(`${cleanupStackTrace(error, 'app.js')}\n`);
      }
    }

    process.exit(1);
  }
})();
