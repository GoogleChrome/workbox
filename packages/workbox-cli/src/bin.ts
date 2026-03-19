#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import meow from 'meow';
import type {Result} from 'meow';
import updateNotifier, {type Package} from 'update-notifier';

import {app} from './app.js';
import {cleanupStackTrace} from './lib/cleanup-stack-trace.js';
import {helpText} from './lib/help-text.js';
import {logger} from './lib/logger.js';

export const supportedFlags = {
  debug: {
    type: 'boolean',
  },
  injectManifest: {
    type: 'boolean',
  },
  watch: {
    type: 'boolean',
  },
} as const;

export type SupportedFlags = typeof supportedFlags;

void (async () => {
  const params: Result<SupportedFlags> = meow(helpText, {
    importMeta: import.meta,
    flags: supportedFlags,
  });

  updateNotifier({pkg: params.pkg as Package}).notify();

  try {
    await app(params);
  } catch (error) {
    if (error instanceof Error) {
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
