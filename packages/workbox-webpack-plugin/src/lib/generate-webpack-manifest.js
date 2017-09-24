module.exports = (manifestEntries, manifestVarName) =>
  new Promise((resolve) => resolve(
  `self.${manifestVarName} = ${JSON.stringify(manifestEntries, null, 2)};`
));
