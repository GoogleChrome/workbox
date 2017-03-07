---
layout: index
title: Getting Started
navigation_weight: 1
---

# Getting Started

If you are completely new to service workers and sw-helpers,
the easiest place to start with `sw-cli`.

This is a command line tool that can build you a service
worker that will precache the assets for your site so that
it can work offline.

## Install

The command line tool uses Node to run, so make sure you
have [Node installed before proceeding](https://nodejs.org/en/).

Once you have Node, you can get `sw-cli` from NPM by running:

```
npm install -g sw-cli
```

## Generating a Service Worker

To generate a service worker for your project just run
the CLI with the 'generate:sw' command.

```
sw-cli generate:sw
```

This will ask a range of questions about your web app like
which directory contains the assets for site, which assets
you'd like cache etc.

![Screenshot of the sw-cli command.](./images/sw-cli-questions.png)

After the command has run you'll have two new files, a
`sw-lib.vX.X.X.min.js` and `sw.js` file (unless you changed
the file name).

To use the service worker, you'll need to register your
newly generated service worker file in your web page,
which you can do like so:

```
if(navigator.serviceworker) {
  navigator.serviceworker.register('/sw.js')
  .catch(function(err) {
    console.error('Unable to register service worker.', err);
  });
}
```

With this, the browser will register your `sw.js` which
will preache the assets in your app and serve them
from the cache.

## What is in sw.js?

For those who are curious, let's look at whats in the
generated service worker.
