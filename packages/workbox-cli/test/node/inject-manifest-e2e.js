const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const proxyquire = require('proxyquire');

require('chai').should();

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

  it('should be able to generate a service for example-1 with CLI', function() {
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
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(tmpDirectory);
      },
      './lib/questions/ask-sw-src': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(swSrc);
      },
      './lib/questions/ask-sw-dest': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(swDest);
      },
      './lib/questions/ask-save-config': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(true);
      },
      './lib/questions/ask-extensions-to-cache': () => {
        if (enforceNoQuestions) {
          return Promise.reject('Injected Error - No Questions Expected');
        }
        return Promise.resolve(FILE_EXTENSIONS);
      },
    });

    const cli = new SWCli();
    return cli.handleCommand('inject:manifest')
    .then(() => {
      const fileOutput = fs.readFileSync(swDest).toString();
      fileOutput.should.equal(`someVariables.precache([
  {
    "url": "/images/web-fundamentals-icon192x192.png",
    "revision": "93ffb20d77327583892ca47f597b77aa"
  },
  {
    "url": "/index.html",
    "revision": "24abd5daf6d87c25f40c2b74ee3fbe93"
  },
  {
    "url": "/page-1.html",
    "revision": "544658ab25ee8762dc241e8b1c5ed96d"
  },
  {
    "url": "/page-2.html",
    "revision": "a3a71ce0b9b43c459cf58bd37e911b74"
  },
  {
    "url": "/styles/stylesheet-1.css",
    "revision": "934823cbc67ccf0d67aa2a2eeb798f12"
  },
  {
    "url": "/styles/stylesheet-2.css",
    "revision": "884f6853a4fc655e4c2dc0c0f27a227c"
  }
]);
`);
    })
    .then(() => {
      // Should be able to handle command with no questions
      enforceNoQuestions = true;
      return cli.handleCommand('inject:manifest');
    });
  });
});
