/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');
const fse = require('fs-extra');
const glob = require('glob');
const upath = require('path');

const {docs_build} = require('../../../gulp-tasks/docs.js');

describe('[all] JSDocs', function () {
  it('should run JSDocs and have no unexpected results', async function () {
    // Windows is super unhappy with the JSDocs build pipeline.
    // With gulp.cmd in spawn, the query string used by the baseline template
    // causes issues.
    if (process.platform === 'win32') {
      this.skip();
      return;
    }

    this.timeout(60 * 1000);

    const projectRoot = upath.join(__dirname, '..', '..', '..');
    const docsPath = upath.join(projectRoot, 'docs');
    await docs_build();

    const docs = glob.sync('*.html', {
      cwd: docsPath,
    });

    // global.html is only added when the docs have stray global values.
    expect(
      docs.includes('global.html'),
      `'global.html' should not be present in ${docsPath}`,
    ).to.be.false;

    // On some occasions, module.exports can leak into JSDocs, and breaks
    // into the final template.
    const indexAllHTML = await fse.readFile(
      upath.join(docsPath, 'index-all.html'),
      'utf8',
    );
    expect(
      indexAllHTML.includes(
        '<a href="module.html#.exports">module.exports</a>',
      ),
      `'module.exports' was found in index-all.html`,
    ).to.be.false;

    // We document this private method because we expect developers to
    // override it in their extending classes.
    const privateMethodAllowlist = ['_handle'];

    // string.matchAll() isn't supported before node v12...
    const regexp = /<a href="([^"]+)">/g;
    let match;
    while ((match = regexp.exec(indexAllHTML)) !== null) {
      const href = match[1];
      if (
        href.includes('#_') &&
        !privateMethodAllowlist.some((allow) => href.endsWith(allow))
      ) {
        throw new Error(`Private method found in JSDocs: ${href}`);
      }
    }
  });
});
