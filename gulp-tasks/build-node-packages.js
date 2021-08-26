/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const TJS = require('typescript-json-schema');
const upath = require('upath');

const constants = require('./utils/constants');
const packageRunner = require('./utils/package-runner');

async function buildNodePackage(packagePath) {
  const outputDirectory = upath.join(
    packagePath,
    constants.PACKAGE_BUILD_DIRNAME,
  );

  const configFile = upath.join(
    __dirname,
    'utils',
    'node-projects-babel.config.json',
  );

  await execa(
    'babel',
    [
      '--config-file',
      configFile,
      `${packagePath}/src`,
      '--out-dir',
      outputDirectory,
      '--copy-files',
    ],
    {preferLocal: true},
  );
}

async function generateWorkboxBuildJSONSchema(packagePath) {
  // We only want to do this for workbox-build, but this function might be
  // run for any package, so exit early.
  if (!packagePath.endsWith('workbox-build')) {
    return;
  }

  const program = TJS.programFromConfig(
    upath.join(packagePath, 'tsconfig.json'),
  );
  const generator = TJS.buildGenerator(program, {
    noExtraProps: true,
    required: true,
  });
  const optionTypes = [
    'GenerateSWOptions',
    'GetManifestOptions',
    'InjectManifestOptions',
    'WebpackGenerateSWOptions',
    'WebpackInjectManifestOptions',
  ];
  for (const optionType of optionTypes) {
    const schema = generator.getSchemaForSymbol(optionType);

    if (schema.properties.manifestTransforms) {
      schema.properties.manifestTransforms.items = {};
    }

    if (schema.properties.exclude) {
      schema.properties.exclude.items = {};
    }

    if (schema.properties.include) {
      schema.properties.include.items = {};
    }

    // See https://github.com/GoogleChrome/workbox/issues/2910
    if (schema.definitions.OnSyncCallback) {
      schema.definitions.OnSyncCallback = {};
    }

    if (schema.definitions.RouteMatchCallback) {
      schema.definitions.RouteMatchCallback = {};
    }

    if (schema.definitions.RouteHandlerCallback) {
      schema.definitions.RouteHandlerCallback = {};
    }

    // See https://github.com/GoogleChrome/workbox/issues/2901
    if (schema.definitions.WorkboxPlugin) {
      for (const plugin of Object.keys(
        schema.definitions.WorkboxPlugin.properties,
      )) {
        schema.definitions.WorkboxPlugin.properties[plugin] = {};
      }
    }

    await fse.writeJSON(
      upath.join(packagePath, 'src', 'schema', `${optionType}.json`),
      schema,
      {spaces: 2},
    );
  }
}

module.exports = {
  build_node_packages: parallel(
    packageRunner('build_node_packages', 'node', buildNodePackage),
  ),
  build_node_ts_packages: parallel(
    packageRunner(
      'build_node_ts_packages',
      'node_ts',
      generateWorkboxBuildJSONSchema,
    ),
  ),
};
