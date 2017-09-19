const vm = require('vm');
const glob = require('glob');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');

const validateFiles = (fileManifestOutput, exampleProject, fileExtensions, swDest, modifyUrlPrefix) => {
  // Check the manifest is defined by the manifest JS.
  expect(fileManifestOutput).to.exist;

  // Check the files that we expect to be defined are.
  let expectedFiles = glob.sync(
    `${exampleProject}/**/*.{${fileExtensions.join(',')}}`, {
    ignore: [
      path.join(exampleProject, swDest),
      path.join(exampleProject, path.dirname(swDest), 'workbox-sw.prod.*.js'),
      path.join(exampleProject, 'node_modules', '**', '*'),
      path.join(exampleProject, 'workbox-cli-config.js'),
    ],
  });

  expectedFiles = expectedFiles.map((file) => {
    return `${path.relative(exampleProject, file).replace(path.sep, '/')}`;
  });

  if (fileManifestOutput.length !== expectedFiles.length) {
    console.error('File Manifest: ', fileManifestOutput);
    console.error('Globbed Files: ', expectedFiles);

    throw new Error('File manifest and glob lengths are different.');
  }

  fileManifestOutput.forEach((fileManifestEntryDetails) => {
    let correctedURL = fileManifestEntryDetails.url;
    try {
      if (modifyUrlPrefix && Object.keys(modifyUrlPrefix).length > 0) {
        Object.keys(modifyUrlPrefix).forEach((key) => {
          const value = modifyUrlPrefix[key];
          correctedURL = correctedURL.replace(value, key);
        });
      }
      let filePath = path.join(exampleProject, correctedURL);
      fs.statSync(filePath);
    } catch (err) {
      console.error(err);
      throw new Error(`The path '${fileManifestEntryDetails.url}' from the manifest doesn't seem valid.`);
    }

    const expectedFileIndex = expectedFiles.indexOf(correctedURL);
    if (expectedFileIndex === -1) {
      console.log('MANIFEST FILES: ', fileManifestOutput);
      console.log('EXPECTED FILES: ', expectedFiles);
      throw new Error(`Unexpected file in manifest (1): '${fileManifestEntryDetails.url}'`);
    }

    expectedFiles.splice(expectedFileIndex, 1);
    expect(typeof fileManifestEntryDetails.revision).to.equal('string');
    expect(fileManifestEntryDetails.revision.length).to.be.gt(0);
  });

  expect(expectedFiles.length).to.equal(0);
};

const fakeRunAndGetManifest = (swDest) => {
  let manifestOutputFromSW;

  // Create a fake class to get the manifest contents
  class WorkboxSW {
    precache(fileManifest) {
      manifestOutputFromSW = fileManifest;
    }
  }
  const injectedSelf = {WorkboxSW};

  const swContent = fs.readFileSync(swDest);

  // To smoke test the service worker is valid JavaScript we can run it
  // in Node's JavaScript parsed. `runInNewContext` comes without
  // any of the usual APIs (i.e. no require API, no console API, nothing)
  // so we inject a `self` API to emulate the service worker environment.
  vm.runInNewContext(swContent, {
    self: injectedSelf,
    importScripts: () => {
      // NOOP
    },
  });

  return manifestOutputFromSW;
};

const fakeRunAndCompare = (generateSWCb, swDest, exampleProject, fileExtensions, modifyUrlPrefix) => {
  return generateSWCb()
  .then(() => {
    console.log(`         Smoke testing first build of service worker @ '${swDest}'`);
    const manifest = fakeRunAndGetManifest(swDest);

    console.log(`         Verifying the precached assets are as expected`);
    validateFiles(manifest, exampleProject, fileExtensions, swDest, modifyUrlPrefix);
  })
  .then(() => {
    // Rerun and ensure the sw and workbox-sw files are excluded from the output.
    return generateSWCb();
  })
  .then(() => {
    console.log(`         Smoke testing second build of service worker @ '${swDest}'`);
    const manifest = fakeRunAndGetManifest(swDest);

    console.log(`         Verifying the precached assets are as expected`);
    validateFiles(manifest, exampleProject, fileExtensions, swDest, modifyUrlPrefix);

    return manifest;
  });
};

module.exports = fakeRunAndCompare;
