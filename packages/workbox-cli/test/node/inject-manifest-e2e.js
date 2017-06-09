const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const proxyquire = require('proxyquire');

const expect = require('chai').expect;

describe('Generate SW End-to-End Tests', function() {
  let tmpDirectory;

  // NOTE: No jpg
  const FILE_EXTENSIONS = ['html', 'css', 'js', 'png'];

  before(function() {
    tmpDirectory = fs.mkdtempSync(path.join(__dirname, 'tmp-'));
  });

  // Kill the web server once all tests are complete.
  after(function() {
    this.timeout(10 * 1000);

    return fsExtra.remove(tmpDirectory)
      .catch((error) => console.log(error));
  });

  it('should be able to generate a service for example-2 with CLI', function() {
    this.timeout(120 * 1000);

    process.chdir(tmpDirectory);

    fsExtra.copySync(
      path.join(__dirname, '..', 'static', 'example-project-2'),
      tmpDirectory);

    const swSrc = path.join(tmpDirectory, 'sw.tmpl');
    const swDest = path.join(tmpDirectory, `${Date.now()}-sw.js`);

    let enforceNoQuestions = false;
    const SWCli = proxyquire('../../build/index', {
      './lib/questions/ask-root-of-web-app': () => {
        if (enforceNoQuestions) {
          return Promise.reject(Error('Injected Error - No Questions Expected'));
        }
        return Promise.resolve(tmpDirectory);
      },
      './lib/questions/ask-sw-src': () => {
        if (enforceNoQuestions) {
          return Promise.reject(Error('Injected Error - No Questions Expected'));
        }
        return Promise.resolve(swSrc);
      },
      './lib/questions/ask-sw-dest': () => {
        if (enforceNoQuestions) {
          return Promise.reject(Error('Injected Error - No Questions Expected'));
        }
        return Promise.resolve(swDest);
      },
      './lib/questions/ask-save-config': () => {
        if (enforceNoQuestions) {
          return Promise.reject(Error('Injected Error - No Questions Expected'));
        }
        return Promise.resolve(true);
      },
      './lib/questions/ask-extensions-to-cache': () => {
        if (enforceNoQuestions) {
          return Promise.reject(Error('Injected Error - No Questions Expected'));
        }
        return Promise.resolve(FILE_EXTENSIONS);
      },
    });

    const cli = new SWCli();
    return cli.handleCommand('inject:manifest')
    .then(() => {
      const fileOutput = fs.readFileSync(swDest).toString();
      const regex = new RegExp(`someVariables.precache\\(\\[
  {
    "url": "/images/web-fundamentals-icon192x192.png",
    "revision": "\\w*"
  },
  {
    "url": "/index.html",
    "revision": "\\w*"
  },
  {
    "url": "/page-1.html",
    "revision": "\\w*"
  },
  {
    "url": "/page-2.html",
    "revision": "\\w*"
  },
  {
    "url": "/styles/stylesheet-1.css",
    "revision": "\\w*"
  },
  {
    "url": "/styles/stylesheet-2.css",
    "revision": "\\w*"
  }
\\]\\);`);
      const result = regex.exec(fileOutput);
      expect(result).to.exist;
    })
    .then(() => {
      // Should be able to handle command with no questions
      enforceNoQuestions = true;
      return cli.handleCommand('inject:manifest');
    });
  });
});
