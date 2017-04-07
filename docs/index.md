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

## sw-build

## sw-cli

## sw-lib

## Advanced Usage
