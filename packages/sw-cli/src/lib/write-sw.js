const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const template = require('lodash.template');

const errors = require('./errors');
const logHelper = require('./log-helper');

module.exports = (swPath, manifestEntries, swlibPath, rootDirectory) => {
  try {
    mkdirp.sync(path.dirname(swPath));
  } catch (err) {
    logHelper.error(errors['unable-to-make-sw-directory'], err);
    return Promise.reject(err);
  }

  const templatePath = path.join(
    __dirname, '..', 'lib', 'templates', 'sw.js.tmpl');
  return new Promise((resolve, reject) => {
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) {
        logHelper.error(errors['read-sw-template-failure'], err);
        return reject(err);
      }
      resolve(data);
    });
  })
  .then((templateString) => {
    const relSwlibPath = path.relative(rootDirectory, swlibPath);

    try {
      return template(templateString)({
        manifestEntries: manifestEntries,
        swlibPath: relSwlibPath,
      });
    } catch (err) {
      logHelper.error(errors['populating-sw-tmpl-failed'], err);
      throw err;
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(swPath, populatedTemplate, (err) => {
        if (err) {
          logHelper.error(errors['sw-write-failure'], err);
          return reject(err);
        }

        resolve();
      });
    });
  });
};
