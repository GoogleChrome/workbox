'use strict';

const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const template = require('lodash.template');

const errors = require('../errors');

const defaultFormat = 'iife';
const formatsToTemplates = {
  iife: 'file-manifest.js.tmpl',
  es: 'file-manifest-es2015.tmpl',
};

const writeFileManifest = (manifestFilePath, manifestEntries, format) => {
  if (!manifestFilePath || typeof manifestFilePath !== 'string' ||
    manifestFilePath.length === 0) {
    return Promise.reject(new Error(errors['invalid-manifest-path']));
  }

  if (!manifestEntries || !(Array.isArray(manifestEntries))) {
    return Promise.reject(new Error(errors['invalid-manifest-entries']));
  }

  format = format || defaultFormat;
  if (!(format in formatsToTemplates)) {
    return Promise.reject(new Error(errors['invalid-manifest-format']));
  }

  for (let i = 0; i < manifestEntries.length; i++) {
    const entry = manifestEntries[i];

    if (typeof entry === 'string') {
      // Revisioned strings are ok.
      continue;
    }

    if (typeof entry === 'object') {
      if (!entry || !entry.url) {
        return Promise.reject(new Error(errors['invalid-manifest-entries']));
      }
    } else {
      return Promise.reject(new Error(errors['invalid-manifest-entries']));
    }
  }

  const templatePath = path.join(__dirname, '..', 'templates',
    formatsToTemplates[format]);

  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(manifestFilePath), (err) => {
      if (err) {
        return reject(
          new Error(
            errors['unable-to-make-manifest-directory'] +
            ` '${err.message}'`
          )
        );
      }
      resolve();
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
          return reject(
            new Error(
              errors['read-manifest-template-failure'] + ` '${err.message}'`
            )
          );
        }
        resolve(data);
      });
    });
  })
  .then((templateString) => {
    try {
      return template(templateString)({
        manifestEntries: manifestEntries,
      });
    } catch (err) {
      throw new Error(errors['populating-manifest-tmpl-failed'] +
        ` '${err.message}'`);
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(manifestFilePath, populatedTemplate, (err) => {
        if (err) {
          return reject(new Error(errors['manifest-file-write-failure'] +
            ` '${err.message}'`));
        }

        resolve();
      });
    });
  });
};

module.exports = writeFileManifest;
