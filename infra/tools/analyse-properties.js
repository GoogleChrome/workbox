/**
 * This file should be run as a node script to analyse the content of the
 * browser bundles.
 *
 * It's an extremely naive approach to picking property names out and seeing
 * how often they are used in the final browser bundles. This can be
 * used to detect variable names that are long and used repeatedly meaning
 * that a small refactor allowing `uglify-es` to mangle these properties,
 * could lead to reasonable improvement in final bundle size.
 *
 * This is very rough and vague. It needs to be run manually and if it's not
 * used can and should be removed from Workbox repo.
 */
const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const babylon = require('babylon');
const gulp = require('gulp');

// Load up the gulpfile.
require(path.join(__dirname, '..', '..', 'gulpfile.js'));

class AnalyseBuildForProperties {
  run() {
    const filePaths = this.getBuildFiles();
    return Promise.all(filePaths.map((filePath) => {
      const rawAnalysis = this.analyzeFile(filePath);
      const analysis = this.tidyData(rawAnalysis);

      return {
        filePath,
        analysis,
      };
    }));
  }

  getBuildFiles() {
    const buildGlob = path.join(__dirname, '..', '..', 'packages',
      '*', 'build', 'browser-bundles', '*.js');
    return glob.sync(buildGlob);
  }

  analyzeFile(filePath) {
    const fileContents = fs.readFileSync(filePath).toString();

    const parsedCode = babylon.parse(fileContents);
    const tokens = parsedCode.tokens;
    const nameTokens = tokens.filter((token) => {
      return token.type.label === 'name';
    });

    const matches = {};

    nameTokens.forEach((token) => {
      const variableName = token.value;
      if (!matches[variableName]) {
        matches[variableName] = 0;
      }
      matches[variableName]++;
    });

    return Object.keys(matches).map((matchKey) => {
      return {
        propertyName: matchKey,
        propertyCount: matches[matchKey],
      };
    });
  }

  tidyData(analysisEntries) {
    return analysisEntries.filter((entry) => {
      // If there is only one entry or it's a single character it's
      // either not important or it's already been minified.
      return entry.propertyCount > 1 && entry.propertyName.length > 1;
    })
    .sort((a, b) => {
      return b.propertyCount - a.propertyCount;
    });
  }

  printDetails({filePath, analysis}) {
    let longestPropertyName = 0;
    analysis.forEach((entry) => {
      if (entry.propertyName.length > longestPropertyName) {
        longestPropertyName = entry.propertyName.length;
      }
    });

    console.log();
    console.log(`Results for '${path.relative(process.cwd(), filePath)}'`);
    console.log();

    analysis.forEach((entry) => {
      const numberOfSpaces = longestPropertyName - entry.propertyName.length;
      const extraSpace = ' '.repeat(numberOfSpaces);
      console.log(`    ${entry.propertyName} ` +
        `${extraSpace} ${entry.propertyCount}`);
    });
      console.log();
  }
}

new Promise((resolve, reject) => {
  gulp.task('build')((err, results) => {
    if (err) {
      return reject(err);
    }

    resolve();
  });
})
.then(() => {
  const analysisTool = new AnalyseBuildForProperties();
  analysisTool.run()
  .then((results) => {
    results.forEach((entry) => {
      analysisTool.printDetails(entry);
    });
  });
})
.catch((err) => {
  console.error(err);
});
