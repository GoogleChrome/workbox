/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/* eslint-env node */
/* eslint-disable valid-jsdoc, require-jsdoc */

const name = require('jsdoc/name');
const BaselinePublishJob = require('jsdoc-baseline/lib/publishjob');

class PublishJob extends BaselinePublishJob {
  constructor(...args) {
    super(...args);
    this._symbolNames = {};
    this._data;
  }

  generateTocYaml(symbols, basepath) {
    symbols.sort(function (a, b) {
      let aName = a.kind === 'namespace' ? a.longname : a.name;
      let bName = b.kind === 'namespace' ? b.longname : b.name;

      aName = aName.toLowerCase();
      bName = bName.toLowerCase();

      if (aName > bName) {
        return 1;
      }

      if (aName < bName) {
        return -1;
      }

      return 0;
    });

    // check for duplicated names
    symbols.forEach((symbol) => {
      const symbolName =
        symbol.kind === 'namespace' ? symbol.longname : symbol.name;
      if ({}.hasOwnProperty.call(this._symbolNames, symbolName)) {
        this._symbolNames[symbolName] = true;
      } else {
        this._symbolNames[symbolName] = false;
      }
    });

    // To disambiguate duplicated names, prepend the name and scope of the
    // parent. For example, if you have foo.bar.Qux and foo.baz.Qux, the
    // disambiguated names are bar.Quxand baz.Qux.
    symbols.forEach((symbol) => {
      let mappedName = null;
      const symbolName =
        symbol.kind === 'namespace' ? symbol.longname : symbol.name;

      if (this._symbolNames[symbolName] === true) {
        if (symbol.kind !== 'namespace') {
          // get info for the parent's name
          const atomized = name.shorten(symbol.longname);
          const atomizedParent = name.shorten(atomized.memberof);
          // prepend the parent's name and the symbol's scope to the name
          mappedName = atomizedParent.name + atomized.scope + symbol.name;
        } else {
          mappedName = symbol.longname;
        }
      }

      symbol.tocYamlName =
        mappedName ||
        (symbol.kind === 'namespace' ? symbol.longname : symbol.name);
    });

    const data = {
      symbols,
      basepath,
    };

    this.generate('toc-yaml', data, '_toc.yaml');
  }

  generateIndex(readme) {
    const data = {
      allLongnamesTree: this.allLongnamesTree,
      package: this.package,
      pageTitle: global.env.opts.query ? global.env.opts.query.productName : '',
      readme: readme || null,
    };

    this.generate('index', data, this.indexUrl);

    return this;
  }

  generateIndexAll(longnames) {
    longnames.sort();
    const data = {
      longnames: longnames,
      pageTitle: global.env.opts.query ? global.env.opts.query.productName : '',
    };

    this.generate('index-all', data, 'index-all.html');
  }
}

/** const PublishJob = module.exports = function(...args) {
  Parent.apply(this, [].slice.call(args, 0));
};
util.inherits(PublishJob, Parent);**/

module.exports = PublishJob;
