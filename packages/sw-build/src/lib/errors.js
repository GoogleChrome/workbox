module.exports = {
  'unable-to-get-rootdir': 'Unable to get the root directory of your web app.',
  'unable-to-get-file-extensions': 'Unable to get file extensions to ' +
    'determine files to cache.',
  'no-extension': 'Unable to detect a usable extension for a file in your ' +
    'web app directory.',
  'no-file-extensions-found': 'No files could be found that are suitable for ' +
    'caching.',
  'no-file-extensions-selected': 'No file extensions were selected so nothing' +
    ' would be cached.',
  'invalid-file-manifest-name': 'The File Manifest Name must have at lease ' +
    'one character.',
  'unable-to-get-file-manifest-name': 'Unable to get a file manifest name.',
  'invalid-dest': `The 'dest' value must be a valid path.`,
  'unable-to-get-sw-name': 'Unable to get a service worker file name.',
  'unable-to-get-save-config': 'An error occurred when asking to save details' +
    'in a config file.',
  'unable-to-get-file-hash': 'An error occurred when attempting to create a ' +
    'file hash.',
  'unable-to-get-file-size': 'An error occurred when attempting to get a ' +
    'file size.',
  'unable-to-glob-files': 'An error occurred when globbing for files.',
  'unable-to-make-manifest-directory': 'Unable to make output directory for ' +
    'file manifest.',
  'read-manifest-template-failure': 'Unable to read template for file manifest',
  'populating-manifest-tmpl-failed': 'An error occurred when populating the ' +
    'file manifest template.',
  'manifest-file-write-failure': 'Unable to write the file manifest.',
  'unable-to-make-sw-directory': 'Unable to make the directories to output ' +
    'the service worker path.',
  'read-sw-template-failure': 'Unable to read the service worker template ' +
    'file.',
  'sw-write-failure': 'Unable to write the service worker file.',
  'unable-to-copy-sw-lib': 'SW-Lib is needed by the service worker and could ' +
    'not be copied over to your new site.',
  'invalid-generate-sw-input': 'The input to generateSW() must be an ' +
    'object',
  'invalid-root-directory': 'The supplied rootDirectory must be ' +
    'a path as a string.',
  'invalid-exclude-files': 'The excluded files should be an array of strings.',
  'invalid-get-manifest-entries-input': 'The input to ' +
    'getFileManifestEntries() must be an object.',
  'invalid-manifest-path': 'The supplied manifest path is not a string with ' +
    'at least one character.',
  'invalid-manifest-entries': 'The manifest entries must be an array of ' +
    'strings or JavaScript objects containing a url parameter.',
  'invalid-generate-file-manifest-arg': 'The input to generateFileManifest() ' +
    'must be an Object.',
  'invalid-manifest-format': `The value of the 'format' option passed to
    generateFileManifest() must be either 'iife' (the default) or 'es'.`,
  'invalid-static-file-globs': `The 'staticFileGlobs' value must be an array ` +
    `of strings.`,
  'invalid-templated-urls': `The 'templatedUrls' value should be ` +
    `an object that maps URLs to either a string, or to an array of glob ` +
    `patterns.`,
  'templated-url-matches-glob': `One of the 'templatedUrls' URL s` +
    `is already being tracked via staticFileGlobs: `,
  'invalid-glob-ignores': `The 'globIgnore' parameter must be an ` +
    `array string glob patterns.`,
  'modify-url-prefix-bad-url': `modifyUrlPrefix helper was given a bad URL ` +
    `for input. This is likely an error with sw-build.`,
  'modify-url-prefix-bad-prefixes': `The 'modifyUrlPrefix' parameter must be ` +
    `an object with string key value pairs.`,
  'invalid-inject-manifest-arg': `The input to 'injectManifest()' must be ` +
    `be an object.`,
  'injection-point-not-found': `Unable to find a place to inject the ` +
    `manifest. Please ensure that you have 'swlib.cacheRevisionedAssets([])' ` +
    `somewhere in your service worker file.`,
  'multiple-injection-points-found': `There can only be one injection point ` +
    `in your service worker file. Please ensure you only have one instance ` +
    `of  'swlib.cacheRevisionedAssets([])' in your service worker file.`,
};
