import {PackageJson} from 'type-fest';

import {BroadcastCacheUpdateOptions} from 'workbox-broadcast-update/BroadcastCacheUpdate';
import {GoogleAnalyticsInitializeOptions} from 'workbox-google-analytics/initialize';
import {HTTPMethod} from 'workbox-routing/utils/constants';
import {QueueOptions} from 'workbox-background-sync/Queue';
import {RouteHandler, RouteMatchCallback} from 'workbox-core/types';
import {CacheableResponseOptions} from 'workbox-cacheable-response/CacheableResponse';
import {ExpirationPluginOptions} from 'workbox-expiration/ExpirationPlugin';
import {WorkboxPlugin} from 'workbox-core/types';

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
    cacheName?: string;
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
  cacheId?: string;
  cleanupOutdatedCaches?: boolean;
  clientsClaim?: boolean;
  directoryIndex?: string;
  disableDevLogs?: boolean;
  ignoreURLParametersMatching?: Array<RegExp>;
  importScripts?: Array<string>;
  inlineWorkboxRuntime?: boolean;
  mode?: string;
  navigateFallback?: string;
  navigateFallbackAllowlist?: Array<RegExp>;
  navigateFallbackDenylist?: Array<RegExp>;
  navigationPreload?: boolean;
  offlineGoogleAnalytics?: boolean | GoogleAnalyticsInitializeOptions;
  runtimeCaching: Array<RuntimeCaching>;
  skipWaiting?: boolean;
  sourcemap?: boolean;
}

export interface GlobPartial {
  globDirectory?: string;
  globFollow?: boolean;
  globIgnores: Array<string>;
  globPatterns?: Array<string>;
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
  mode?: string;
}

export interface SWDestPartial {
  swDest: string;
}

/** @see {isGenerateSWOptions} ts-auto-guard:type-guard */
export type GenerateSWOptions = GlobPartial & GeneratePartial & BasePartial & SWDestPartial;

/** @see {isGetManifestOptions} ts-auto-guard:type-guard */
export type GetManifestOptions = GlobPartial & BasePartial;

/** @see {isInjectManifestOptions} ts-auto-guard:type-guard */
export type InjectManifestOptions = InjectPartial & Omit<GlobPartial, 'globDirectory'> & BasePartial & SWDestPartial & {
  globDirectory: string;
};

/** @see {isWebpackGenerateSWOptions} ts-auto-guard:type-guard */
export type WebpackGenerateSWOptions = WebpackPartial & GeneratePartial & BasePartial & SWDestPartial & {
  importScriptsViaChunks: Array<string>;
};

/** @see {isWebpackInjectManifestOptions} ts-auto-guard:type-guard */
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
