module.exports = (manifestEntries, manifestVarName) => Promise.resolve(
`self.${manifestVarName} = ${JSON.stringify(manifestEntries, null, 2)};`
);
