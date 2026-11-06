#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import meow from 'meow';
import {pathToFileURL} from 'url';
import updater from 'tiny-updater';

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

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// Skip the check in the same cases that update-notifier did.
function shouldCheckForUpdates(): boolean {
  return (
    Boolean(process.stdout.isTTY) &&
    !process.env.CI &&
    !process.env.NO_UPDATE_NOTIFIER &&
    process.env.NODE_ENV !== 'test' &&
    !process.argv.includes('--no-update-notifier')
  );
}

void (async () => {
  // meow needs to locate package.json, and import.meta isn't available in
  // CommonJS, so pass the same information that it would contain.
  const params = meow(helpText, {
    importMeta: {url: pathToFileURL(__filename).href} as ImportMeta,
  }) as unknown as CliParams;
  if (shouldCheckForUpdates()) {
    void updater({
      name: params.pkg.name as string,
      version: params.pkg.version as string,
      ttl: ONE_DAY_IN_MS,
    });
  }

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
