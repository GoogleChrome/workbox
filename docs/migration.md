---
layout: index
title: Contributing
navigation_weight: 7
---
# Migration from sw-framework

[Intro]

## Command-Line Interface (sw-precache)

Just like `sw-precache`, Workbox allows you generate a service worker using the command line using [`sw-cli`](sw-cli). There are a few differences between the two.

* Information that was previously passed as command line arguments is now gathered by a wizard that provides the option of saving your choices to a config file (`sw-cli-config.json`).
* `sw-precache` does **not** support runtime caching. For that you'll need [`sw-lib`](sw-lib) or one of the lower-level modules.