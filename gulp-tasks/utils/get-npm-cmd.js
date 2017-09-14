module.exports = () => process.platform === 'win32' ?
'npm.cmd' : 'npm';
