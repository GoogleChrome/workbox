---
layout: index
title: Contributing
navigation_weight: 7
---
# Contributing

We'd love to accept your patches! Before we can take them, we have to jump a couple of legal hurdles.

Please fill out either the individual or corporate Contributor License Agreement (CLA).
  * If you are an individual writing original source code and you're sure you own the intellectual property, then you'll need to sign an [individual CLA](https://developers.google.com/open-source/cla/individual).
  * If you work for a company that wants to allow you to contribute your work, then you'll need to sign a [corporate CLA](https://developers.google.com/open-source/cla/corporate).

Follow either of the two links above to access the appropriate CLA and instructions for how to sign and return it. Once we receive it, we'll be able to
accept your pull requests.

## Contributing A Patch

1. Submit an issue describing your proposed change to the repo in question.
1. The repo owner will respond to your issue promptly.
1. If your proposed change is accepted, and you haven't already done so, sign a Contributor License Agreement (see details above).
1. Fork the repo, develop and test your code changes.
1. Ensure that your code adheres to the existing style in the sample to which you are contributing.
1. Submit a pull request.

## Building Projects

There are a couple of commands that will help you make working with these
modules a little easier:

### Installing Dependencies

You need to install dependencies for the top level project and the gulp CLI:

    npm install
    npm install -g gulp-cli

Some modules *may* have dependencies of their own which you'd install like so:

    cd packages/<Project Name>/
    npm install
    cd ../../

With this you are now ready to build and test projects locally.

### Projects and Gulp

Gulp has a set of tasks that can be run for **all** projects or for a specific
project using the `--project` flag.

For example, to build all projects you'd run:

    gulp build

To build a specific project, in this case sw-routing, you'd run this:

    gulp build --project sw-routing

You can see all the tasks with:

    gulp --tasks

Useful commands:

    // Build and watch for changes
    gulp build:watch

    // Lint
    gulp lint

    // Run tests
    gulp test

    // Serve up static files (Useful to run browser tests)
    gulp serve
