import path from 'path';
import glob from 'glob';
import {expect} from 'chai';
import fs from 'fs-extra';
import spawn from '../../../gulp-tasks/utils/spawn-promise-wrapper';
import logHelper from '../../../infra/utils/log-helper';

describe('[all] JSDocs', function() {
  it('should run JSDocs and have no unexpected results', async function() {
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

    logHelper.log('Docs path: ', docsPath);
    logHelper.log('Globbed Docs: ', docs);

    // global.html is only added when the docs have stray global values.
    if (docs.indexOf('global.html') !== -1) {
      throw new Error('There should be **no** globals in the JSDocs.');
    }

    // On some occassions module.exports can leak into JSDocs and breaks
    // in the final template.
    expect(docs.indexOf('index-all.html')).to.not.equal(-1);
    const indexAllContents = fs.readFileSync(path.join(docsPath, 'index-all.html'))
      .toString();
    if (indexAllContents.indexOf('<a href="module.html#.exports">module.exports</a>') !== -1) {
      throw new Error('There is a stray `module.exports` in the docs. ' +
        'Find and fix this issue.');
    }
  });
});
