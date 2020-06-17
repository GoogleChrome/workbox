"use strict";
/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpText = void 0;
exports.helpText = `Usage:
$ workbox <command> [options]

Commands:
  wizard [--injectManifest]
    Runs the configuration wizard, which will generate a
    config file based on answers to questions.
    By default the configuration will be tailored to the
    generateSW use case.
    If --injectManifest is provided, the wizard will ask
    questions needed for the injectManifest use case.

  generateSW [<path/to/config.js>] [--watch]
    Creates a new service worker file based on the options
    in the config file (defaults to workbox-config.js).
    If --watch is provided, the CLI will stay running, and will
    rebuild the service worker each time a file in the precache
    manifest changes.
    See https://bit.ly/wb-generateSW

  injectManifest [<path/to/config.js>] [--watch]
    Takes an existing service worker file and creates a
    copy of it with a precache manifest "injected" into
    it. The precache manifest is generated based on the
    options in the config file (defaults to workbox-config.js).
    If --watch is provided, the CLI will stay running, and will
    rebuild the service worker each time a file in the precache
    manifest changes.
    See https://bit.ly/wb-injectManifest

  copyLibraries <path/to/parent/dir>
    Makes a local copy of all of the Workbox libraries inside
    a version directory at the location specified. This is intended
    for developers using injectManifest who prefer using local,
    rather than CDN hosted, libraries.

Config file:
  In 'generateSW' or 'injectManifest' mode, the config file should be a
  JavaScript file, in CommonJS module format.
  By default, a config file named workbox-config.js in the current
  directory is assumed, but this can be overridden.

Examples:
  $ workbox wizard
  $ workbox wizard --injectManifest
  $ workbox generateSW --watch
  $ workbox injectManifest configs/workbox-dev-config.js
  $ workbox copyLibraries build/
`;
