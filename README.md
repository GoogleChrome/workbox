[![Travis Build Status][travis-image]][travis-url]
[![AppVeyor Build status][appveyor-image]][appveyor-url]
[![Dev Dependency Status][dev-dependency-image]][dev-dependency-url]
[![TypeScript definitions on DefinitelyTyped](https://definitelytyped.org/badges/standard-flat.svg)](https://www.npmjs.com/package/@types/workbox-sw)

<img src='https://user-images.githubusercontent.com/110953/28352645-7a8a66d8-6c0c-11e7-83af-752609e7e072.png' width='500px'/>

# Welcome to Workbox!

Workbox is a collection of JavaScript libraries for
[Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/). 

## Documentation

* [Overview](https://developers.google.com/web/tools/workbox/) ([site source](https://github.com/google/WebFundamentals/tree/master/src/content/en/tools/workbox))
* [Get started](https://developers.google.com/web/tools/workbox/guides/get-started)
* [Contribute](CONTRIBUTING.md)

Workbox is available on `npm`. We have [installation
instructions](https://developers.google.com/web/tools/workbox/guides/precache-files/)
available depending on your build tool or bundler of choice, including
`webpack`.

## Contributing

Development happens in the open on GitHub. We're thankful to the community for
contributing any improvements.

Please read the [guide to contributing](CONTRIBUTING.md) prior to filing any
pull requests.

<h2>Core Team</h2>

<table>
  <tbody>
    <tr>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/jeffposnick.png?s=150">
        <br>
        <a href="https://github.com/jeffposnick">Jeff Posnick</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/gauntface.png?s=150">
        <br>
        <a href="https://github.com/gauntface">Matt Gaunt</a>
      </td>
      <td align="center" width="20%" valign="top">
        <img width="100" height="100" src="https://github.com/addyosmani.png?s=150">
        <br>
        <a href="https://github.com/addyosmani">Addy Osmani</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/philipwalton.png?s=150">
        <br>
        <a href="https://github.com/philipwalton">Philip Walton</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/prateekbh.png?s=150">
        <br>
        <a href="https://github.com/prateekbh">Prateek Bhatnagar</a>
      </td>
       <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/kaycebasques.png?s=150">
        <br>
        <a href="https://github.com/kaycebasques">Kayce Basques</a>
      </td>
     </tr>
  </tbody>
</table>

## License

Copyright 2018 Google, Inc.

Licensed under the [Apache License, Version 2.0](LICENSE) (the "License");
you may not use this file except in compliance with the License. You may
obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[npm-url]: https://npmjs.org/package/workbox
[npm-image]: https://badge.fury.io/js/workbox.svg
[travis-url]: https://travis-ci.org/GoogleChrome/workbox
[travis-image]: https://travis-ci.org/GoogleChrome/workbox.svg?branch=master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/4ct8ph4d34c5ifnw?svg=true
[appveyor-url]: https://ci.appveyor.com/project/gauntface/workbox
[dev-dependency-url]: https://david-dm.org/GoogleChrome/workbox?type=dev
[dev-dependency-image]: https://david-dm.org/GoogleChrome/workbox/dev-status.svg
Skip to content
 
Search or jump to…

Pull requests
Issues
Marketplace
Explore
 @oscarg933 Sign out
You are over your private repository plan limit (4 of 0). Please upgrade your plan, make private repositories public, or remove private repositories so that you are within your plan limit.
Your private repositories have been locked until this is resolved. Thanks for understanding. You can contact support with any questions.
188
6,590 375 GoogleChrome/workbox
 Code  Issues 127  Pull requests 10  Wiki  Insights
renaming-plugins #1757
 Open	prateekbh wants to merge 3 commits into next from renaming-plugins
+65 −63 
 Conversation 2   Commits 3   Checks 0   Files changed 18
Conversation
Reviewers
 @jeffposnick jeffposnick

 @philipwalton philipwalton
Assignees
No one assigned
Labels
None yet
Projects
None yet
Milestone
No milestone
Notifications
You’re receiving notifications because you’re watching this repository.
4 participants
@prateekbh
@googlebot
@jeffposnick
@philipwalton
@prateekbh
 Collaborator
prateekbh commented 28 days ago
R: @jeffposnick @philipwalton

Renames plugins for better mangling by closure compiler

 @prateekbh prateekbh force-pushed the renaming-plugins  branch 5 times, most recently from dc1e1af to 95d2d7a 28 days ago
 @prateekbh
renaming-plugins
83bf876
 @prateekbh prateekbh force-pushed the renaming-plugins  branch from 95d2d7a to 83bf876 28 days ago
 @prateekbh prateekbh requested review from jeffposnick and philipwalton and removed request for jeffposnick 28 days ago
 @prateekbh
renaming files
4702069
@jeffposnick
jeffposnick requested changes 22 days ago
Thanks, @prateekbh. I'm seeing Travis CI failures running the integration tests:

[Workbox]: Running Integration test on test/workbox-broadcast-cache-update/integration with NODE_ENV 'dev' and browser 'Google Chrome Stable'
  broadcastCacheUpdate.Plugin
    1) should broadcast a message on the expected channel when there's a cache update
  0 passing (736ms)
  1 failing
  1) broadcastCacheUpdate.Plugin
       should broadcast a message on the expected channel when there's a cache update:
     Error: Failed to register a ServiceWorker: ServiceWorker script evaluation failed
      at module.exports (infra/testing/activate-and-control.js:71:11)
      at process._tickCallback (internal/process/next_tick.js:68:7)
Those tests rely on the workbox.<packageName>.Plugin syntax for using the plugins, and I was under the impression that that particular syntax was going to stay the same, since all you wanted to change was the exported symbols in the ES modules. But I think your current PR ends up also renaming, e.g., workbox.broadcastUpdate.Plugin to workbox.broadcastUpdate.BroadcastUpdatePlugin, which is not what we want (and which triggers the test failures).

Going back to the workbox-broadcast-cache-update package as an example, this file is responsible for setting up the mapping between the ES module exports and the symbols that appear under the workbox.broadcastUpdate.* namespace:

https://github.com/GoogleChrome/workbox/blob/renaming-plugins/packages/workbox-broadcast-cache-update/browser.mjs

However, in your PR, that just continues using whatever's in _public.mjs as the symbol names, and that means that BroadcastUpdatePlugin is being used, instead of Plugin.

So I think you need to update those browser.mjs definitions for all of the packages and make sure that the symbols that browser.mjs ends up exporting are Plugin, like before.

Does that make sense?

 @philipwalton
Revert the public plugin names
318af85
@googlebot
 
googlebot commented 6 minutes ago
So there's good news and bad news.

+1 The good news is that everyone that needs to sign a CLA (the pull request submitter and all commit authors) have done so. Everything is all good there.

confused The bad news is that it appears that one or more commits were authored or co-authored by someone other than the pull request submitter. We need to confirm that all authors are ok with their commits being contributed to this project. Please have them confirm that here in the pull request.

Note to project maintainer: This is a terminal state, meaning the cla/google commit status will not change from this state. It's up to you to confirm consent of all the commit author(s), set the cla label to yes (if enabled on your project), and then merge this pull request when appropriate.

Merge state
Changes requested
1 review requesting changes 
@jeffposnick
jeffposnick requested changes
See review
@philipwalton
philipwalton was requested for review
All checks have failed
1 errored and 2 failing checks
@googlebot
cla/google — CLAs are signed, but unable to verify author consent

continuous-integration/appveyor/pr — AppVeyor build failed
Details

continuous-integration/travis-ci/pr — The Travis CI build failed
Details
This branch has no conflicts with the base branch
Only those with write access to this repository can merge pull requests.
@oscarg933
   
 
 
 
Leave a comment
Attach files by dragging & dropping, selecting them, or pasting from the clipboard.

 Styling with Markdown is supported
 ProTip! Add comments to specific lines under Files changed.
© 2018 GitHub, Inc.
Terms
Privacy
Security
Status
Help
Contact GitHub
Pricing
API
Training
Blog
About
Press h to open a hovercard with more details.
