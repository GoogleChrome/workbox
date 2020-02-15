const {execSync} = require('child_process');

const stdout = execSync(`git diff --name-only "master"..."${process.argv[2]}"`);
const output = stdout.toString();

console.log('Files changed:', output);

const matched = output.toString().split('\n')
    .some((file) => file.match(/\.(?:js|json|mjs|ts|yml)$/));

if (matched) {
  console.log('At least one file matches.');
  process.exit(0);
}

console.log('No files match.');
process.exit(1);
