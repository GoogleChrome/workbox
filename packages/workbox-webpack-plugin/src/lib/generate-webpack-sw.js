const {readFile} = require('./utils/read-file');

const importScripts = ({
  workboxSWFilename,
  manifestFilename,
}) => `importScripts('${workboxSWFilename}', '${manifestFilename}');`;

const generateSW = ({
  workboxSWFilename,
  manifestFilename,
  manifestVarName,
}) => Promise.resolve(`
${importScripts({workboxSWFilename, manifestFilename})}

const workboxSW = new self.WorkboxSW();
workboxSW.precache(self.${manifestVarName});
`);

const generateOrCopySW = (config, swSrc) => new Promise((resolve, reject) => {
  if (!swSrc) {
    return generateSW(config).then((serviceWorker) => resolve(serviceWorker));
  } else {
    return readFile(swSrc).then((serviceWorkerSource) =>
      resolve(`${importScripts(config)}\n${serviceWorkerSource}`)
    );
  }
});

module.exports = generateOrCopySW;
