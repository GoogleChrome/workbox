#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import meow from 'meow';
import {pathToFileURL} from 'url';
import updateNotifier from 'update-notifier';

import {app} from './app';
import {cleanupStackTrace} from './lib/cleanup-stack-trace.js';
import {helpText} from './lib/help-text';
import {logger} from './lib/logger';

export interface SupportedFlags {
  debug?: boolean;
  injectManifest?: boolean;
  watch?: boolean;
}

export interface CliParams {
  input: Array<string>;
  flags: SupportedFlags;
  pkg: Record<string, unknown>;
  showHelp: (exitCode?: number) => never;
}

void (async () => {
  // meow needs to locate package.json, and import.meta isn't available in
  // CommonJS, so pass the same information that it would contain.
  const params = meow(helpText, {
    importMeta: {url: pathToFileURL(__filename).href} as ImportMeta,
  }) as unknown as CliParams;
  updateNotifier({
    pkg: params.pkg as unknown as updateNotifier.Package,
  }).notify();

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
