---
layout: index
title: Workbox
navigation_weight: 0
---

Workbox is …

Section will include

* A brief def of service worker and PWAs with a links to robust documentation.
* TBD

## What Does Workbox Do?

Despite the number of modules in Workbox, there are a number of approaches to using these tools which many be used separately or together in any number of combinations.

* **Precaching, runtime caching and routing**: Use [sw-lib](#sw-lib) to quickly
  implement [caching strategies](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/) or a route.
* **Build process**: Generate a service worker or manifest in your build process
  using [sw-build](#sw-build).
* **Command line**: Generate a service worker or manifest from the command line.
* **Go beyond the basics**: Implement more advanced capabilities and more
  sophisticated use cases using any of the other libraries, which are [described
  below](#the-libraries).

## Setting Up

Each module is installed separately using the command line as listed on the [modules](modules-overview). To use a particular module:

1. Install the module. For example:

   `npm install --save-dev sw-build`
2. Copy the module's JavaScript and map files to your serving directory. 

   `cp node_modules/sw-build/build/* app/`
3. Import the modules to your service worker file. For example:

   `importScripts('sw-build.min.js');`

## sw-cli

If you are completely new to service workers and Workbox,
the easiest place to start is `sw-cli`.

This is a command line tool that will build a service
worker to precache assets for your site and make it work offline.

[Learn More about sw-cli](../reference-docs/stable/latest/module-sw-cli.html#main)

## sw-build

If you want to build and configure service workers in a node script then use
`sw-build`.

[Learn More about sw-build](../reference-docs/stable/latest/module-sw-build.html#main)

## sw-lib

If you'd like to use the Workbox libraries, and you already have your own 
service worker, then `sw-lib` is a better option.

[Learn More about sw-lib](../reference-docs/stable/latest/module-sw-lib.html#main)

## Advanced Usage

If you've been using Workbox for a while, or you're ambitious, you can delve
into its more advanced features. Browse the
[recipes section](recipes), try the
[examples](examples),
or look up something in the
[mobules reference](reference-docs/stable/latest/).
