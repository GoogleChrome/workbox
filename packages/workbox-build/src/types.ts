import {PackageJson} from 'type-fest';

import {BroadcastCacheUpdateOptions} from 'workbox-broadcast-update/BroadcastCacheUpdate.js';
import {GoogleAnalyticsInitializeOptions} from 'workbox-google-analytics/initialize.js';
import {HTTPMethod} from 'workbox-routing/utils/constants.js';
import {QueueOptions} from 'workbox-background-sync/Queue.js';
import {RouteHandler, RouteMatchCallback} from 'workbox-core/types.js';
import {CacheableResponseOptions} from 'workbox-cacheable-response/CacheableResponse.js';
import {ExpirationPluginOptions} from 'workbox-expiration/ExpirationPlugin.js';
import {WorkboxPlugin} from 'workbox-core/types.js';

export interface ManifestEntry {
  integrity?: string;
  revision: string | null;
  url: string;
}

type StrategyName = 'CacheFirst' | 'CacheOnly' | 'NetworkFirst' | 'NetworkOnly' | 'StaleWhileRevalidate';

export interface RuntimeCaching {
  handler: RouteHandler | StrategyName;
  method?: HTTPMethod;
  options?: {
    backgroundSync?: {
      name: string;
      options?: QueueOptions;
    };
    broadcastUpdate?: {
      // TODO: This option is ignored since we switched to using postMessage().
      // Remove it in the next major release.
      channelName?: string;
      options: BroadcastCacheUpdateOptions;
    };
    cacheableResponse?: CacheableResponseOptions;
    cacheName?: string | null;
    expiration?: ExpirationPluginOptions;
    networkTimeoutSeconds?: number;
    plugins?: Array<WorkboxPlugin>;
    precacheFallback?: {
      fallbackURL: string;
    },
    fetchOptions?: RequestInit;
    matchOptions?: CacheQueryOptions;
  };
  urlPattern: RegExp | string | RouteMatchCallback;
}

export interface ManifestTransformResult {
  manifest: Array<ManifestEntry & {size: number}>;
  warnings?: Array<string>;
}

export type ManifestTransform = (
  manifestEntries: Array<ManifestEntry & {size: number}>,
  compilation?: unknown
) => Promise<ManifestTransformResult> | ManifestTransformResult;

export interface BasePartial {
  additionalManifestEntries?: Array<string | ManifestEntry>;
  dontCacheBustURLsMatching?: RegExp;
  manifestTransforms?: Array<ManifestTransform>;
  maximumFileSizeToCacheInBytes?: number;
  modifyURLPrefix: {
    [key: string]: string;
  };
}

export interface GeneratePartial {
  babelPresetEnvTargets?: Array<string>;
  cacheId?: string | null;
  cleanupOutdatedCaches?: boolean;
  clientsClaim?: boolean;
  directoryIndex?: string | null;
  disableDevLogs?: boolean;
  ignoreURLParametersMatching?: Array<RegExp>;
  importScripts?: Array<string>;
  inlineWorkboxRuntime?: boolean;
  mode?: string | null;
  navigateFallback?: string | null;
  navigateFallbackAllowlist?: Array<RegExp>;
  navigateFallbackDenylist?: Array<RegExp>;
  navigationPreload?: boolean;
  offlineGoogleAnalytics?: boolean | GoogleAnalyticsInitializeOptions;
  runtimeCaching: Array<RuntimeCaching>;
  skipWaiting?: boolean;
  sourcemap?: boolean;
}

export interface GlobPartial {
  globDirectory?: string | null;
  globFollow?: boolean;
  globIgnores: Array<string>;
  globPatterns: Array<string>;
  /**
   * @default true
   */
  globStrict?: boolean;
  templatedURLs: {
    [key: string]: string | Array<string>;
  };
}

interface InjectPartial {
  injectionPoint: string;
  swSrc: string;
}

interface WebpackPartial {
  chunks?: Array<string>;
  exclude?: Array<string | RegExp | ((arg0: string) => any)>;
  excludeChunks?: Array<string>;
  include?: Array<string | RegExp | ((arg0: string) => any)>;
  mode?: string | null;
}

export interface SWDestPartial {
  swDest: string;
}

export type GenerateSWOptions = GlobPartial & GeneratePartial & BasePartial & SWDestPartial;

export type GetManifestOptions = GlobPartial & BasePartial;

export type InjectManifestOptions = InjectPartial & Omit<GlobPartial, 'globDirectory'> & BasePartial & SWDestPartial & {
  globDirectory: string;
};

export type WebpackGenerateSWOptions = WebpackPartial & GeneratePartial & BasePartial & SWDestPartial & {
  importScriptsViaChunks: Array<string>;
};

export type WebpackInjectManifestOptions = WebpackPartial & InjectPartial & BasePartial & SWDestPartial & {
  compileSrc?: boolean;
  webpackCompilationPlugins?: Array<any>;
};

export interface GetManifestResult {
  count: number,
  manifestEntries: Array<ManifestEntry>,
  size: number,
  warnings: Array<string>
}

export type BuildResult = Omit<GetManifestResult, 'manifestEntries'> & {
  filePaths: Array<string>;
};

export interface FileDetails {
  file: string;
  hash: string;
  size: number;
}

export type BuildType = 'dev' | 'prod';

export interface WorkboxPackageJSON extends PackageJson {
  workbox?: {
    browserNamespace?: string,
    packageType?: string;
    prodOnly?: boolean;
  };
};
