const expect = require('chai').expect;

module.exports = (expectedEntries, actualEntries) => {
  const urlToIndex = new Map(expectedEntries.map((entry, index) => {
    return [entry.url, index];
  }));

  expect(actualEntries).to.have.lengthOf(expectedEntries.length,
    'The expected and actual number of manifest entries do not match.');
  for (const entry of actualEntries) {
    expect(urlToIndex.has(entry.url), entry.url).to.be.true;
    const expectedEntry = expectedEntries[urlToIndex.get(entry.url)];
    expect(entry).to.eql(expectedEntry);
  }
};
