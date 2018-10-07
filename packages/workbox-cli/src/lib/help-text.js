/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = `Usage:
$ workbox <command> [options]

Commands:
  wizard [--injectManifest]
    Runs the configuration wizard, which will generate a
    config file based on answers to questions.
    By default the configuration will be tailored to the
    generateSW use case.
    If --injectManifest is provided, the wizard will ask
    questions needed for the injectManifest use case.

  generateSW [<path/to/config.js>]
    Creates a new service worker file based on the options
    in the config file (defaults to workbox-config.js).
    See https://goo.gl/gVo87N

  injectManifest [<path/to/config.js>]
    Takes an existing service worker file and creates a
    copy of it with a precaching manifest "injected" into
    it. The precaching manifest is generated based on the
    options in the config file (defaults to workbox-config.js).
    See https://goo.gl/8bs14N

  copyLibraries <path/to/parent/dir>
    Makes a local copy of all of the Workbox libraries inside
    a version directory at the location specified. This is intended
    for developers using injectManifest who prefer using local,
    rather than CDN hosted, libraries.

Config file:
  In 'generateSW' or 'injectManifest' mode, the config file should be a
  JavaScript file, in CommonJS module format.
  By default, a config location of workbox-config.js in the current
  directory is assumed, but this can be overridden.
  The exported object's properties should follow https://goo.gl/YYPcyY

Examples:
  $ workbox wizard
  $ workbox wizard --injectManifest
  $ workbox generateSW
  $ workbox injectManifest configs/workbox-dev-config.js
  $ workbox copyLibraries build/
`;
