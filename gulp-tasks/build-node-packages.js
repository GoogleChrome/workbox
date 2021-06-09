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
  const outputDirectory = upath.join(packagePath,
      constants.PACKAGE_BUILD_DIRNAME);

  const configFile = upath.join(__dirname, 'utils',
      'node-projects-babel.config.json');

  await execa('babel', [
    '--config-file', configFile,
    `${packagePath}/src`,
    '--out-dir', outputDirectory,
    '--copy-files',
  ], {preferLocal: true});
}

async function generateWorkboxBuildJSONSchema(packagePath) {
  const program = TJS.programFromConfig(upath.join(packagePath,
    'tsconfig.json'));
  const generator = TJS.buildGenerator(program);
  const optionTypes = [
    'GenerateSWOptions',
    'GetManifestOptions',
    'InjectManifestOptions',
    'WebpackGenerateSWOptions',
    'WebpackInjectManifestOptions'
  ];
  for (const optionType of optionTypes) {
    const schema = generator.getSchemaForSymbol(optionType);
    await fse.writeJSON(upath.join(packagePath, 'src', 'schema',
      `${optionType}.json`), schema);
  }
}

async function buildNodeTSPackage(packagePath) {
  // Hardcode special logic for workbox-build, as it's the only package
  // that requires JSON schema generation.
  if (packagePath.endsWith('workbox-build')) {
    await generateWorkboxBuildJSONSchema(packagePath);
  }

  await execa('tsc', ['-b', packagePath], {preferLocal: true});
}

module.exports = {
  build_node_packages: parallel(packageRunner('build_node_packages', 'node',
      buildNodePackage)),
  build_node_ts_packages: parallel(packageRunner('build_node_ts_packages',
      'node_ts', buildNodeTSPackage)),
};
