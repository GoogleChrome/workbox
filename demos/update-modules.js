const fs = require('fs-extra');
const path = require('path');

let workboxModules = require('./functions/modules.json');

// Has Docs
workboxModules = workboxModules.map((singleModule) => {
  const docPath = path.join(
    __dirname, 'public', 'reference-docs', `module-${singleModule.name}.html`
  );

  let exists = false;
  try {
    fs.accessSync(docPath);
    exists = true;
  } catch (err) {
    // NOOP
  }

  singleModule.hasDocs = exists;
  return singleModule;
});

// Has demos
workboxModules = workboxModules.map((singleModule) => {
  const docPath = path.join(
    __dirname, 'functions', 'views', 'demo', `${singleModule.name}.hbs`
  );

  let exists = false;
  try {
    fs.accessSync(docPath);
    exists = true;
  } catch (err) {
    // NOOP
  }

  singleModule.hasDemo = exists;
  return singleModule;
});

fs.writeFileSync(
  path.join(__dirname, 'functions', 'modules.json'),
  JSON.stringify(workboxModules, null, 2)
);
