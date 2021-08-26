/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe(`[workbox-build] lib/bundle`, function () {
  const MODULE_PATH = '../../../../packages/workbox-build/build/lib/bundle';
  let bundle;
  let stubs;

  beforeEach(function () {
    const rollupStub = {
      generate: sinon.stub().resolves({
        output: [
          {
            fileName: 'asset-filename',
            type: 'asset',
            source: 'asset-source',
          },
          {
            code: 'chunk1-code',
            fileName: 'chunk1-filename',
            type: 'chunk',
          },
          {
            code: 'chunk2-code',
            fileName: 'chunk2-filename',
            type: 'chunk',
            map: 'sourcemap-contents',
          },
        ],
      }),
    };

    stubs = {
      rollupStub,
      '@babel/preset-env': sinon.stub(),
      'fs-extra': {
        writeFile: sinon.stub().resolves(),
      },
      'upath': {
        format: sinon.stub().callsFake((args) => `${args.dir}${args.base}`),
        parse: sinon.stub().returns({base: 'sw.js', dir: ''}),
      },
      'tempy': {
        file: sinon.stub().returns('sw.js'),
      },
      '@rollup/plugin-node-resolve': sinon.stub(),
      '@rollup/plugin-replace': sinon.stub(),
      '@rollup/plugin-babel': {
        babel: sinon.stub(),
      },
      'rollup-plugin-terser': {
        terser: sinon.stub(),
      },
      '@surma/rollup-plugin-off-main-thread': sinon.stub(),
      'rollup': {
        rollup: sinon.stub().resolves(rollupStub),
      },
    };

    bundle = proxyquire(MODULE_PATH, stubs).bundle;
  });

  it(`should pass 'babelPresetEnvTargets' to @babel/preset-env`, async function () {
    const babelPresetEnvTargets = ['target1', 'target2'];

    await bundle({
      babelPresetEnvTargets,
    });

    // This is ugly, but necessary due to the way babel() is configured.
    const babelParams = stubs['@rollup/plugin-babel'].babel.args[0][0];
    expect(babelParams.presets[0][1].targets.browsers).to.eql(
      babelPresetEnvTargets,
    );
  });

  it(`should use loadz0r and configure manualChunks when 'inlineWorkboxRuntime' is false`, async function () {
    await bundle({
      inlineWorkboxRuntime: false,
    });

    expect(stubs.rollup.rollup.args[0][0].manualChunks).to.be.a('function');
    expect(stubs['@surma/rollup-plugin-off-main-thread'].calledOnce).to.be.true;
  });

  it(`should not use loadz0r or configure manualChunks when 'inlineWorkboxRuntime' is true`, async function () {
    await bundle({
      inlineWorkboxRuntime: true,
    });

    expect(stubs.rollup.rollup.args[0][0].manualChunks).not.to.exist;
    expect(stubs['@surma/rollup-plugin-off-main-thread'].notCalled).to.be.true;
  });

  it(`should replace NODE_ENV with the 'mode' value`, async function () {
    const mode = 'mode-value';
    await bundle({
      mode,
    });

    expect(stubs['@rollup/plugin-replace'].args).to.eql([
      [
        {
          'preventAssignment': true,
          'process.env.NODE_ENV': `"${mode}"`,
        },
      ],
    ]);
  });

  it(`should use terser when 'mode' is 'production'`, async function () {
    const mode = 'production';
    await bundle({
      mode,
    });

    expect(stubs['rollup-plugin-terser'].terser.calledOnce).to.be.true;
  });

  it(`should not use terser when 'mode' is not 'production'`, async function () {
    const mode = 'something-else';
    await bundle({
      mode,
    });

    expect(stubs['rollup-plugin-terser'].terser.notCalled).to.be.true;
  });

  it(`should pass the 'sourcemap' parameter value through to Rollup`, async function () {
    const sourcemap = true;
    await bundle({
      sourcemap,
    });

    expect(stubs.rollupStub.generate.args[0][0].sourcemap).to.eql(sourcemap);
  });

  it(`should process the generated Rollup bundle into the expected return value`, async function () {
    const files = await bundle({});

    expect(files).to.eql([
      {
        contents: 'asset-source',
        name: 'asset-filename',
      },
      {
        contents: 'chunk1-code',
        name: 'chunk1-filename',
      },
      {
        contents: 'sourcemap-contents',
        name: 'chunk2-filename.map',
      },
      {
        contents: 'chunk2-code//# sourceMappingURL=chunk2-filename.map\n',
        name: 'chunk2-filename',
      },
    ]);
  });
});
