#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import meow from 'meow';
import updateNotifier from 'update-notifier';

import {app} from './app';
import {cleanupStackTrace} from './lib/cleanup-stack-trace.js';
import {helpText} from './lib/help-text';
import {logger} from './lib/logger';

export interface SupportedFlags extends meow.AnyFlags {
  debug: meow.BooleanFlag;
  injectManifest: meow.BooleanFlag;
  watch: meow.BooleanFlag;
}

void (async () => {
  const params: meow.Result<any> = meow(helpText);
  updateNotifier({pkg: params.pkg as updateNotifier.Package}).notify();

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
