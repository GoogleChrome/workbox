/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/* eslint-env node */

const baselineConfig = require('jsdoc-baseline/lib/config');
const fileFinder = require('jsdoc-baseline/lib/filefinder');
const helper = require('jsdoc/util/templateHelper');
const path = require('jsdoc/path');

exports.publish = function (data, opts, tutorials) {
  baselineConfig.loadSync();
  baselineConfig
    .set('l10n', path.join(__dirname, 'lang'))
    .set('static', path.join(__dirname, 'static'))
    .set('views.partials', path.join(__dirname, 'views'))
    .set('views.layouts', path.join(__dirname, 'views'))
    .set('modules', path.join(__dirname, 'lib'));

  const config = baselineConfig.get();

  // load the core modules using the file finder
  const modulesFinder = fileFinder.get('modules', config.modules);

  const DocletHelper = modulesFinder.require('./doclethelper');
  const PublishJob = modulesFinder.require('./publishjob');
  const Template = modulesFinder.require('./template');

  const docletHelper = new DocletHelper();
  const template = new Template(config);
  const job = new PublishJob(template, opts);

  // set up tutorials
  helper.setTutorials(tutorials);

  docletHelper.addDoclets(data);

  job
    .setPackage(docletHelper.getPackage())
    .setNavTree(docletHelper.navTree)
    .setAllLongnamesTree(docletHelper.allLongnamesTree);

  // create the output directory so we can start generating files
  job
    .createOutputDirectory()
    // then generate the source files so we can link to them
    .generateSourceFiles(docletHelper.shortPaths);

  // generate globals page if necessary
  job.generateGlobals(docletHelper.globals);

  // generate TOC data and index page
  job
    .generateTocData({hasGlobals: docletHelper.hasGlobals()})
    .generateIndex(opts.readme);

  // generate the rest of the output files (excluding tutorials)
  docletHelper.getOutputLongnames().forEach(function (longname) {
    job.generateByLongname(
      longname,
      docletHelper.getLongname(longname),
      docletHelper.getMemberof(longname),
    );
  });

  // finally, generate the tutorials, and copy static files to the output
  // directory
  job.generateTutorials(tutorials).copyStaticFiles();

  // custom Cast pages
  job.generateTocYaml(
    docletHelper
      .getCategory('classes')
      .concat(docletHelper.getCategory('namespaces'))
      .concat(docletHelper.getCategory('interfaces')),
    global.env.opts.query ? global.env.opts.query.basepath : '',
  );
  job.generateIndexAll(Object.keys(docletHelper.longname));
};
