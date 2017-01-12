const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const glob = require('glob');
const expect = require('chai').expect;

require('chai').should();

describe('Test Example Projects', function() {
  it('should be able to generate manifest for example-1', function() {
    const exampleProject =
      path.join(__dirname, 'example-projects', 'example-1');
    const relativeProjPath = path.relative(process.cwd(), exampleProject);

    // NOTE: No JPG
    const fileExntensions = ['html', 'css', 'js', 'png'];

    const manifestName = `${Date.now()}-manifest.js`;
    const swName = `${Date.now()}-sw.js`;

    const SWCli = proxyquire('../src/cli/index', {
      inquirer: {
        prompt: (questions) => {
          switch (questions[0].name) {
            case 'rootDir':
              return Promise.resolve({
                rootDir: relativeProjPath,
              });
            case 'cacheExtensions':
              return Promise.resolve({
                cacheExtensions: fileExntensions,
              });
            case 'fileManifestName':
              return Promise.resolve({
                fileManifestName: manifestName,
              });
            case 'serviceWorkerName':
              return Promise.resolve({
                serviceWorkerName: swName,
              });
            case 'saveConfig':
              return Promise.resolve({
                saveConfig: false,
              });
            default:
              console.error('');
              console.error(`Unknown question: ${questions[0].name}`);
              console.error('');
              return Promise.reject();
          }
        },
      },
    });

    const cli = new SWCli();
    return cli.handleCommand('generate-sw')
    .then(() => {
      const injectedSelf = {};
      const manifestContent =
        fs.readFileSync(path.join(exampleProject, manifestName));
      // To ensure the manifest is valid JavaScript we can run it
      // in Node's JavaScript parsed. `runInNewContext` comes without
      // any of the usual APIs (i.e. no require API, no console API, nothing)
      // so we inject a `self` API to emulate the service worker environment.
      vm.runInNewContext(manifestContent, {
        self: injectedSelf,
      });

      // Check the manifest is defined by the manifest JS.
      expect(injectedSelf['__file_manifest']).to.exist;

      // Check the files that we expect to be defined are.
      let expectedFiles = glob.sync(`${exampleProject}/**/*.{${fileExntensions.join(',')}}`, {
        ignore: `${exampleProject}/${manifestName}`,
      });
      expectedFiles = expectedFiles.map((file) => {
        return `/${path.relative(exampleProject, file)}`;
      });

      const fileManifestOutput = injectedSelf['__file_manifest'];
      if (fileManifestOutput.length !== expectedFiles.length) {
        console.error('File Manifest: ', fileManifestOutput);
        console.error('Globbed Files: ', expectedFiles);

        throw new Error('File manifest and glob produced different values.');
      }

      fileManifestOutput.forEach((details) => {
        try {
          fs.statSync(path.join(exampleProject, details.url));
        } catch (err) {
          throw new Error(`The path '${details.url}' from the manifest doesn't seem valid.`);
        }

        const expectedFileIndex = expectedFiles.indexOf(details.url);
        if (expectedFileIndex === -1) {
          throw new Error(`Unexpected file in in manifest: '${details.url}'`);
        }

        expectedFiles.splice(expectedFileIndex, 1);

        (typeof details.revision).should.equal('string');
        details.revision.length.should.be.gt(0);
      });

      expectedFiles.length.should.equal(0);
    })
    .then(() => {
      // Rerun and ensure that the manifest is excluded from the output.
      return cli.handleCommand('generate-sw');
    })
    .then(() => {
      const injectedSelf = {};
      const manifestContent =
        fs.readFileSync(path.join(exampleProject, manifestName));
      vm.runInNewContext(manifestContent, {
        self: injectedSelf,
      });

      const fileManifest = injectedSelf['__file_manifest'];
      fileManifest.forEach((manifestEntry) => {
        if (manifestEntry.url === `/${manifestName}`) {
          throw new Error('The manifest itself was not excluded from the generated file manifest.');
        }
      });
    })
    .then(() => {
      // Delete the manifest so the rest of the test is clean.
      fs.unlinkSync(path.join(exampleProject, manifestName));
    });
  });
});
