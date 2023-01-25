/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {oneLine as ol} from 'common-tags';
import assert from 'assert';
import GlobWatcher from 'glob-watcher';
import meow from 'meow';
import prettyBytes from 'pretty-bytes';
import upath from 'upath';
import * as workboxBuild from 'workbox-build';

import {constants} from './lib/constants.js';
import {errors} from './lib/errors.js';
import {logger} from './lib/logger.js';
import {readConfig} from './lib/read-config.js';
import {runWizard} from './lib/run-wizard.js';
import {SupportedFlags} from './bin.js'

interface BuildCommand {
  command: 'generateSW' | 'injectManifest';
  config: any;
  watch: boolean;
}

/**
 * Runs the specified build command with the provided configuration.
 *
 * @param {Object} options
 */
async function runBuildCommand({command, config, watch}: BuildCommand) {
  const {count, filePaths, size, warnings} = await workboxBuild[command](config);

  for (const warning of warnings) {
    logger.warn(warning);
  }

  if (filePaths.length === 1) {
    // Can't change the type of config, we'll consider in next major release.
    // eslint-disable-next-line
    logger.log(`The service worker file was written to ${config.swDest}`);
  } else {
    const message = filePaths
        .sort()
        .map((filePath) => `  • ${filePath}`)
        .join(`\n`);
    logger.log(`The service worker files were written to:\n${message}`);
  }

  logger.log(`The service worker will precache ${count} URLs, ` +
      `totaling ${prettyBytes(size)}.`);

  if (watch) {
    logger.log(`\nWatching for changes...`);
  }
}

export const app = async (params: meow.Result<SupportedFlags>): Promise<void> => {
  // This should not be a user-visible error, unless meow() messes something up.
  assert(params && Array.isArray(params.input), errors['missing-input']);

  // Default to showing the help message if there's no command provided.
  const [command = 'help', option] = params.input;

  switch (command) {
    case 'wizard': {
      await runWizard(params.flags);
      break;
    }

    case 'copyLibraries': {
      assert(option, errors['missing-dest-dir-param']);
      const parentDirectory = upath.resolve(process.cwd(), option);

      const dirName = await workboxBuild.copyWorkboxLibraries(parentDirectory);
      const fullPath = upath.join(parentDirectory, dirName);

      logger.log(`The Workbox libraries were copied to ${fullPath}`);
      logger.log(ol`Add a call to workbox.setConfig({modulePathPrefix: '...'})
        to your service worker to use these local libraries.`);
      logger.log(`See https://goo.gl/Fo9gPX for further documentation.`);
      break;
    }

    case 'generateSW':
    case 'injectManifest': {
      const configPath = upath.resolve(process.cwd(),
          option || constants.defaultConfigFile);

      let config: any;
      try {
        // Can't change the type of config, we'll consider in next major release.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config = readConfig(configPath);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(errors['invalid-common-js-module']);
          throw error;
        }
      }

      logger.log(`Using configuration from ${configPath}.`);

      // Determine whether we're in --watch mode, or one-off mode.
      // Can't change the type of config, we'll consider in next major release.
      /* eslint-disable */
      if (params.flags && params.flags.watch) {
        const options: GlobWatcher.WatchOptions = {ignoreInitial: false};
        if (config.globIgnores) {
          options.ignored = config.globIgnores;
        }
        if (config.globDirectory) {
          options.cwd = config.globDirectory;
        }

        if (config.globPatterns) {
          GlobWatcher(config.globPatterns, options,
            () => runBuildCommand({command, config, watch: true}));
        }

      } else {
        await runBuildCommand({command, config, watch: false});
      }
      /* eslint-disable */
      break;
    }

    case 'help': {
      params.showHelp();
      break;
    }

    default: {
      throw new Error(errors['unknown-command'] + ` ` + command);
    }
  }
};
