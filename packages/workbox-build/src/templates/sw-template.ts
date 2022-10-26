/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import dedent from 'ts-dedent';
import {ModuleRegistry} from '../lib/module-registry';
import {GeneratePartial, ManifestEntry} from '../types';

const header = dedent`
/**
* Welcome to your Workbox-powered service worker!
*
* You'll need to register this file in your web app.
* See https://goo.gl/nhQhGp
*
* The rest of the code is auto-generated. Please don't update this file
* directly; instead, make changes to your Workbox build configuration
* and re-run your build process.
* See https://goo.gl/2aRDsh
*/
`;

type SwTemplateArg = Pick<
  GeneratePartial,
  | 'cacheId'
  | 'cleanupOutdatedCaches'
  | 'clientsClaim'
  | 'disableDevLogs'
  | 'importScripts'
  | 'navigateFallback'
  | 'navigateFallbackDenylist'
  | 'navigateFallbackAllowlist'
  | 'navigationPreload'
  | 'skipWaiting'
> & {
  manifestEntries?: Array<ManifestEntry>;
  offlineAnalyticsConfigString: string | undefined;
  precacheOptionsString: string;
  runtimeCaching: string[];
  use: InstanceType<typeof ModuleRegistry>['use'];
};

export const useSwTemplate = ({
  cacheId,
  cleanupOutdatedCaches,
  clientsClaim,
  disableDevLogs,
  importScripts,
  manifestEntries,
  navigateFallback,
  navigateFallbackDenylist,
  navigateFallbackAllowlist,
  navigationPreload,
  offlineAnalyticsConfigString,
  precacheOptionsString,
  runtimeCaching,
  skipWaiting,
  use,
}: SwTemplateArg): string => {
  const parts = [header];

  if (importScripts) {
    parts.push(dedent`
      importScripts(
        ${importScripts.map((script) => JSON.stringify(script)).join(',\n  ')}
      );
    `);
  }

  if (navigationPreload) {
    parts.push(`${use('workbox-navigation-preload', 'enable')}();`);
  }
  if (cacheId) {
    parts.push(
      `${use('workbox-core', 'setCacheNameDetails')}({prefix: ${JSON.stringify(
        cacheId,
      )}});`,
    );
  }

  if (skipWaiting) {
    parts.push('self.skipWaiting();');
  } else {
    parts.push(dedent`
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          self.skipWaiting();
        }
      });
    `);
  }
  if (clientsClaim) {
    parts.push(`${use('workbox-core', 'clientsClaim')}();`);
  }

  if (Array.isArray(manifestEntries) && manifestEntries.length > 0) {
    parts.push(dedent`
      /**
       * The precacheAndRoute() method efficiently caches and responds to
       * requests for URLs in the manifest.
       * See https://goo.gl/S9QRab
       */
    `);
    // prettier-ignore
    parts.push(dedent`
      ${use('workbox-precaching', 'precacheAndRoute')}(${
        JSON.stringify(manifestEntries, null, 2,)}, ${
        precacheOptionsString
      });
      `
    );
    if (cleanupOutdatedCaches) {
      parts.push(`${use('workbox-precaching', 'cleanupOutdatedCaches')}();`);
    }

    if (navigateFallback) {
      // prettier-ignore
      const createHandlerBoundToURL = dedent`
        ${use('workbox-precaching', 'createHandlerBoundToURL')}(${JSON.stringify(navigateFallback)})
      `;
      let navigateFallbackList = '';
      if (navigateFallbackAllowlist || navigateFallbackDenylist) {
        navigateFallbackList = dedent`, {
            ${
              navigateFallbackAllowlist
                ? `allowlist: [${navigateFallbackAllowlist.toString()}],`
                : ''
            }
            ${
              navigateFallbackDenylist
                ? `denylist: [${navigateFallbackDenylist.toString()}],`
                : ''
            }
          }
        `;
      }
      parts.push(
        `${use('workbox-routing', 'registerRoute')}(
          new ${use(
            'workbox-routing',
            'NavigationRoute',
          )}(${createHandlerBoundToURL}${navigateFallbackList}));`,
      );
    }
  }

  if (runtimeCaching) {
    parts.push(...runtimeCaching);
  }

  if (offlineAnalyticsConfigString) {
    parts.push(
      `${use(
        'workbox-google-analytics',
        'initialize',
      )}(${offlineAnalyticsConfigString});`,
    );
  }

  if (disableDevLogs) {
    parts.push('self.__WB_DISABLE_DEV_LOGS = true;');
  }

  return parts.join('\n');
};
