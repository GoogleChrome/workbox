# How to become a contributor and submit your own code

## Contributor License Agreements

We'd love to accept your patches! Before we can take them, we have to jump a couple of legal hurdles.

Please fill out either the individual or corporate Contributor License Agreement (CLA).

- If you are an individual writing original source code and you're sure you own the intellectual property, then you'll need to sign an [individual CLA](https://developers.google.com/open-source/cla/individual).
- If you work for a company that wants to allow you to contribute your work, then you'll need to sign a [corporate CLA](https://developers.google.com/open-source/cla/corporate).

Follow either of the two links above to access the appropriate CLA and instructions for how to sign and return it. Once we receive it, we'll be able to
accept your pull requests.

## Contributing A Patch

1. Submit an issue describing your proposed change to the repo in question.
1. The repo owner will respond to your issue promptly.
1. If your proposed change is accepted, and you haven't already done so, sign a Contributor License Agreement (see details above).
1. Fork the repo, develop and test your code changes (see details below).
1. Ensure that your code adheres to the existing style in the sample to which you are contributing.
1. Submit a pull request.

## Setting up your environment

Workbox uses [`node`](https://nodejs.org/) and its related toolchain (`npm`, etc.) to install dependencies and run the build and test processes. Please ensure that you have a working `node` installation before proceeding.

Workbox uses `git` hooks via [`husky`](https://typicode.github.io/husky/#/) to automatically run code formatters and linters when committing and pushing code to GitHub. If you're running into issues with the `git` hooks, you may need to [create a `~/.huskyrc` file](https://typicode.github.io/husky/#/?id=command-not-found) to set up your `$PATH` correctly.

It's expected that the Workbox development environment should work on Windows, macOS, and Linux. If you encounter any platform-specific issues, please [open a bug](https://github.com/GoogleChrome/workbox/issues/new).

## Testing your contribution

When making local changes, you'll probably want to ensure that your code builds and passes our test suite. To do this, run the following in your local clone of the repo:

```sh
$ npm ci

$ npm run gulp build

$ npm run gulp test
```

Note that on Windows, `npm run gulp test` will only run a subset of our test suite. The full test suite will always be run as part of the GitHub continuous integration environment against your pull request.

When you add a new feature or fix a bug, please check the test suite to see if its appropriate to add or modify an existing test to cover the updated functionality.

## Running a subset of the tests

Workbox's test suite is split in two parts: one for the `node`-based tooling (`workbox-cli`, `workbox-build`, `workbox-webpack-plugin`) and one for the browser-based code.

To run the tests for just the `node`-based tooling:

```sh
npm run gulp test_node
```

To interactively run tests for the browser-based code, launch the test server:

```sh
npm run gulp test_server
```

Then open a web browser to http://localhost:3004/ and navigate to the test suite for the package you're interested in. For example, to run the tests for `workbox-strategies`, go to http://localhost:3004/test/workbox-streams/sw/

To do an automated run of the browser-based test suite against the full set of supported browsers, run:

```sh
npm run gulp test_integration
```
