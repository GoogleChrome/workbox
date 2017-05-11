const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const glob = require('glob');
const fsExtra = require('fs-extra');
const expect = require('chai').expect;

require('chai').should();

describe('Generate Manifest End-to-End Tests', function() {
  let tmpDirectory;
  // NOTE: No JPG
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  beforeEach(() => {
    tmpDirectory = fs.mkdtempSync(
      path.join(__dirname, 'tmp-')
    );
  });

  afterEach(function() {
    this.timeout(10 * 1000);

    fsExtra.removeSync(tmpDirectory);
  });

  const performTest = (generateManifestCb, {exampleProject, manifestName}) => {
    let fileManifestOutput;
    return generateManifestCb()
    .then(() => {
      const injectedSelf = {};
      const manifestContent =
        fs.readFileSync(path.join(exampleProject, manifestName));
      // To smoke test the manifest generation we can run it
      // in Node's JavaScript parser. `runInNewContext` comes without
      // any of the usual APIs (i.e. no require API, no console API, nothing)
      // so we inject a `self` object to emulate the service worker environment.
      vm.runInNewContext(manifestContent, {
        self: injectedSelf,
      });

      // Check the manifest is defined by the manifest JS.
      expect(injectedSelf.__file_manifest).to.exist;

      fileManifestOutput = injectedSelf.__file_manifest;

      // Check the files that we expect to be defined are.
      let expectedFiles = glob.sync(
        `${exampleProject}/**/*.{${FILE_EXTENSIONS.join(',')}}`, {
        ignore: [
          `${exampleProject}/${manifestName}`,
          `${exampleProject}/workbox-sw.*.min.js`,
        ],
      });
      expectedFiles = expectedFiles.map((file) => {
        return `/${path.relative(exampleProject, file).replace(path.sep, '/')}`;
      });

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
          console.log(expectedFiles);
          throw new Error(`Unexpected file in manifest: '${details.url}'`);
        }

        expectedFiles.splice(expectedFileIndex, 1);

        (typeof details.revision).should.equal('string');
        details.revision.length.should.be.gt(0);
      });

      expectedFiles.length.should.equal(0);
    })
    .then(() => {
      // Rerun and ensure the sw and workbox-sw files are excluded from the output.
      return generateManifestCb();
    })
    .then(() => {
      // Run a second time and ensure the file manifest itself is excluded.
      const injectedSelf = {};
      const manifestContent =
        fs.readFileSync(path.join(exampleProject, manifestName));
        // To smoke test the manifest generation we can run it
        // in Node's JavaScript parser. `runInNewContext` comes without
        // any of the usual APIs (i.e. no require API, no console API, nothing)
        // so we inject a `self` object to emulate the service worker environment.
      vm.runInNewContext(manifestContent, {
        self: injectedSelf,
      });

      const secondFileManifest = injectedSelf.__file_manifest;
      secondFileManifest.length.should.equal(fileManifestOutput.length);
    });
  };

  it('should be able to generate a file manifest for example-1 with CLI', function() {
    this.timeout(60 * 1000);

    fsExtra.copySync(
      path.join(__dirname, '..', 'static', 'example-project-1'),
      tmpDirectory);

    const relativeProjPath = path.relative(process.cwd(), tmpDirectory);

    const manifestName = `${Date.now()}-manifest.js`;

    const SWCli = proxyquire('../../build/index', {
      './lib/questions/ask-root-of-web-app': () => {
        return Promise.resolve(relativeProjPath);
      },
      './lib/questions/ask-manifest-name': () => {
        return Promise.resolve(manifestName);
      },
      './lib/questions/ask-extensions-to-cache': () => {
        return Promise.resolve(FILE_EXTENSIONS);
      },
    });

    const cli = new SWCli();
    return performTest(() => {
      return cli.handleCommand('generate:manifest');
    }, {
      exampleProject: tmpDirectory,
      manifestName,
    });
  });
});
