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
1. Fork the repo, develop and test your code changes.
1. Ensure that your code adheres to the existing style in the sample to which you are contributing.
1. Submit a pull request.

## Running the Test Suite

Workbox's test suite is split in two parts, one for the Node-based tooling (workbox-cli, workbox-webpack-plugin, etc.) and one for the browser-based ServiceWorker code.

To run the tests for the Node-based tooling:

```
npm run gulp test_node
```

To interactively run tests for the browser-based code, launch the test server:

```
npm run gulp test_server
```

Then open your web browser to http://localhost:3004/ and browser for the test suite for the workbox package you're interested in. For example, to run the tests for workbox-strategies, go o http://localhost:3004/test/workbox-streams/sw/.

To do an automated run of the full test suite for the browser-based code against the full set of supported browsers:

```
npm run gulp test_integration
```
