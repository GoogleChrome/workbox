const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const template = require('lodash.template');

const errors = require('./errors');

module.exports = (swPath, manifestEntries, swlibPath, rootDirectory) => {
  try {
    mkdirp.sync(path.dirname(swPath));
  } catch (err) {
    return Promise.reject(
      new Error(`${errors['unable-to-make-sw-directory']}. '${err.message}'`)
    );
  }

  const templatePath = path.join(
    __dirname, '..', 'lib', 'templates', 'sw.js.tmpl');
  return new Promise((resolve, reject) => {
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) {
        return reject(
          new Error(`${errors['read-sw-template-failure']}. '${err.message}'`)
        );
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
      throw new Error(
        `${errors['populating-sw-tmpl-failed']}. '${err.message}'`);
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(swPath, populatedTemplate, (err) => {
        if (err) {
          return reject(
            new Error(`${errors['sw-write-failure']}. '${err.message}'`)
          );
        }

        resolve();
      });
    });
  });
};
