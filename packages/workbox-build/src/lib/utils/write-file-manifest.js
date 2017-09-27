const assert = require('assert');
const fse = require('fs-extra');
const path = require('path');
const template = require('lodash.template');

const errors = require('../errors');

const DEFAULT_FORMAT = 'iife';
const FORMATS_TO_TEMPLATES = {
  iife: 'file-manifest.js.tmpl',
  es: 'file-manifest-es2015.tmpl',
};

const writeFileManifest = async (manifestFilePath, manifestEntries,
                                 format = DEFAULT_FORMAT) => {
  assert(manifestFilePath && typeof manifestFilePath === 'string' &&
    manifestFilePath.length !== 0,
    errors['invalid-manifest-path']);

  assert(Array.isArray(manifestEntries), errors['invalid-manifest-entries']);

  assert((format in FORMATS_TO_TEMPLATES), errors['invalid-manifest-format']);

  assert(manifestEntries.every((entry) => {
      return typeof entry === 'string' ||
        (typeof entry === 'object' && entry && entry.url);
    }),
    errors['invalid-manifest-entries']);

  const templatePath = path.join(__dirname, '..', 'templates',
    FORMATS_TO_TEMPLATES[format]);

  try {
    await fse.mkdirp(manifestFilePath);
  } catch (error) {
    throw new Error(errors['unable-to-make-manifest-directory'] +
      ` '${error.message}'`);
  }

  let templateString;
  try {
    templateString = fse.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(errors['read-manifest-template-failure'] +
      ` '${error.message}'`);
  }

  let populatedTemplate;
  try {
    populatedTemplate = template(templateString)({
      manifestEntries: manifestEntries,
    });
  } catch (error) {
    throw new Error(errors['populating-manifest-tmpl-failed'] +
      ` '${error.message}'`);
  }

  try {
    await fse.writeFile(manifestFilePath, populatedTemplate);
  } catch (error) {
    throw new Error(errors['manifest-file-write-failure'] +
      ` '${error.message}'`);
  }
};

module.exports = writeFileManifest;
