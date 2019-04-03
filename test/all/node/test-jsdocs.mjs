/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const spawn = require('../../../gulp-tasks/utils/spawn-promise-wrapper');


describe('[all] JSDocs', function() {
  it('should run JSDocs and have no unexpected results', async function() {
    // Windows is super unhappy with the JSDocs build pipeline.
    // With gulp.cmd in spawn, the query string used by the baseline template
    // causes issues.
    if (process.platform === 'win32') {
      this.skip();
      return;
    }
    // Building docs takes time.
    this.timeout(60 * 1000);

    const projectRoot = path.join(__dirname, '..', '..', '..');
    const docsPath = path.join(projectRoot, 'docs');
    await spawn('gulp', ['docs:build'], {
      cwd: projectRoot,
    });

    const docs = glob.sync('*.html', {
      cwd: docsPath,
    });

    // global.html is only added when the docs have stray global values.
    if (docs.indexOf('global.html') !== -1) {
      throw new Error('There should be **no** globals in the JSDocs.');
    }

    // On some occasions, module.exports can leak into JSDocs, and breaks
    // into the final template.
    expect(docs.indexOf('index-all.html')).to.not.equal(-1);
    const indexAllContents = fs.readFileSync(path.join(docsPath, 'index-all.html'))
        .toString();
    if (indexAllContents.indexOf('<a href="module.html#.exports">module.exports</a>') !== -1) {
      throw new Error('There is a stray `module.exports` in the docs. ' +
        'Find and fix this issue.');
    }
  });
});
