const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const template = require('lodash.template');

const logHelper = require('./log-helper');
const errors = require('./errors');

module.exports = (manifestFilePath, manifestEntries) => {
  const templatePath = path.join(__dirname, '..', 'lib',
    'templates', 'file-manifest.js.tmpl');

  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(manifestFilePath), (err) => {
      if (err) {
        logHelper.error(errors['unable-to-make-manifest-directory'], err);
        return reject(err);
      }
      resolve();
    });
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
          logHelper.error(errors['read-manifest-template-failure'], err);
          return reject(err);
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
      logHelper.error(errors['populating-manifest-tmpl-failed'], err);
      throw err;
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(manifestFilePath, populatedTemplate, (err) => {
        if (err) {
          logHelper.error(errors['manifest-file-write-failure'], err);
          return reject(err);
        }

        resolve();
      });
    });
  });
};
