/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const AnalyseBuildForProperties = require('./utils/analyse-properties');

async function analyze_properties() {
  const analysisTool = new AnalyseBuildForProperties();
  const results = await analysisTool.run();
  for (const result of results) {
    analysisTool.printDetails(result);
  }
}

module.exports = {
  analyze_properties,
};
