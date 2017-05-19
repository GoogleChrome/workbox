module.exports = {
  'no-file-extensions-to-cache': 'The file extensions to cache must be ' +
    'an array with at least one file extension without the dot at the ' +
    'start of the extension name, i.e. [\'html\']',
  'config-write-failure': 'Unable to write the config file.',
  'config-not-an-object': 'The response from the config file is not a ' +
    'JS Object.',
  'no-file-extensions-found': 'No files could be found that are suitable for ' +
    'caching.',
  'unable-to-get-file-extensions': 'Unable to get file extensions to ' +
    'determine files to cache.',
  'no-file-extensions-selected': 'No file extensions were selected so nothing' +
    ' would be cached.',
  'config-supplied-missing-fields': 'Some configuration was supplied by a ' +
    'a config file or CLI flags, but you must supply all of the following ' +
    'config options / flags: ',
  'invalid-sw-dest': 'The supplied service worker output was invalid. It ' +
    'must be a string with at least one character.',
  'invalid-sw-src': 'The supplied service worker input file was invalid. It ' +
    'must be a string with at least one character.',
  'invalid-config-file-flag': 'The --config-file flag refers to an invalid ' +
    'or non-existent file.',
};
