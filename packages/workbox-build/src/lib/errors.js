module.exports = {
  'unable-to-get-rootdir': 'Unable to get the root directory of your web app.',
  'no-extension': 'Unable to detect a usable extension for a file in your ' +
    'web app directory.',
  'invalid-file-manifest-name': 'The File Manifest Name must have at least ' +
    'one character.',
  'unable-to-get-file-manifest-name': 'Unable to get a file manifest name.',
  'invalid-sw-dest': `The 'swDest' value must be a valid path.`,
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
  'sw-write-failure-directory': 'Unable to write the service worker file; ' +
    'swDest should be a full path to the file, not a path to a directory.',
  'unable-to-copy-workbox-sw': 'workbox-sw is needed by the service worker ' +
    'and could not be copied over to your new site.',
  'invalid-generate-sw-input': 'The input to generateSW() must be an ' +
    'object',
  'invalid-glob-directory': 'The supplied globDirectory must be ' +
    'a path as a string.',
  'invalid-dont-cache-bust': 'The supplied dontCacheBustUrlsMatching ' +
    'parameter must be a RegExp.',
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
  'invalid-static-file-globs': `The 'globPatterns' value must be an array ` +
    `of strings.`,
  'invalid-templated-urls': `The 'templatedUrls' value should be ` +
    `an object that maps URLs to either a string, or to an array of glob ` +
    `patterns.`,
  'templated-url-matches-glob': `One of the 'templatedUrls' URL s` +
    `is already being tracked via 'globPatterns': `,
  'invalid-glob-ignores': `The 'globIgnore' parameter must be an ` +
    `array string glob patterns.`,
  'manifest-entry-bad-url': `The generated manifest contains an entry ` +
    `without a URL string. This is likely an error with workbox-build.`,
  'modify-url-prefix-bad-prefixes': `The 'modifyUrlPrefix' parameter must be ` +
    `an object with string key value pairs.`,
  'invalid-inject-manifest-arg': `The input to 'injectManifest()' must be ` +
    `be an object.`,
  'injection-point-not-found': `Unable to find a place to inject the ` +
    `manifest. Please ensure that you have 'workboxSW.precache([])' ` +
    `somewhere in your service worker file.`,
  'multiple-injection-points-found': `There can only be one injection point ` +
    `in your service worker file. Please ensure you only have one instance ` +
    `of  'workboxSW.precache([])' in your service worker file.`,
  'populating-sw-tmpl-failed': `Unable to generate service worker from ` +
    `template.`,
  'useless-glob-pattern': `One of the glob patterns doesn't match any files. ` +
    `Please remove or fix the following: `,
  'bad-template-urls-asset': `There was an issue reading one of the provided ` +
    `templatedUrls.`,
  'invalid-runtime-caching': `The 'runtimeCaching' parameter must an an ` +
    `array of objects with at least a 'urlPattern' and 'handler'.`,
  'both-glob-patterns-static-file-globs': `Both globPatterns and ` +
    `staticFileGlobs are set. Please fully migrate to globPatterns.`,
  'both-templated-urls-dynamic-urls': `Both templatedUrls and ` +
    `dynamicUrlToDependencies are set. Please fully migrate to templatedUrls.`,
  'urlPattern-is-required': `The urlPattern option is required when using
    runtimeCaching.`,
  'handler-is-required': `The handler option is required when using
    runtimeCaching.`,
  'bad-manifest-transforms': `The 'manifestTransforms' value should be an ` +
    `array of functions.`,
};
