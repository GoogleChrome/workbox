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
  /**
   * @default 2097152
   */
  maximumFileSizeToCacheInBytes?: number;
  // https://github.com/YousefED/typescript-json-schema/issues/424
  // This would ideally be {[key: string]: string}
  modifyURLPrefix?: any;
}

export interface GeneratePartial {
  /**
   * @default ["chrome >= 56"]
   */
  babelPresetEnvTargets?: Array<string>;
  cacheId?: string | null;
  /**
   * @default false
   */
  cleanupOutdatedCaches?: boolean;
  /**
   * @default false
   */
  clientsClaim?: boolean;
  directoryIndex?: string | null;
  /**
   * @default false
   */
  disableDevLogs?: boolean;
  ignoreURLParametersMatching?: Array<RegExp>;
  importScripts?: Array<string>;
  /**
   * @default false
   */
  inlineWorkboxRuntime?: boolean;
  /**
   * @default "production"
   */
  mode?: string | null;
  /**
   * @default null
   */
  navigateFallback?: string | null;
  navigateFallbackAllowlist?: Array<RegExp>;
  navigateFallbackDenylist?: Array<RegExp>;
  /**
   * navigationPreload is only valid when runtimeCaching is configured. However,
   * this can't be expressed via TypeScript, so it's enforced via runtime logic.
   * @default false
   */
  navigationPreload?: boolean;
  /**
   * @default false
   */
  offlineGoogleAnalytics?: boolean | GoogleAnalyticsInitializeOptions;
  runtimeCaching?: Array<RuntimeCaching>;
  /**
   * @default false
   */
  skipWaiting?: boolean;
  /**
   * @default true
   */
  sourcemap?: boolean;
}

export interface GlobPartial {
  globDirectory: string;
  /**
   * @default true
   */
  globFollow?: boolean;
  /**
   * @default ["**\/node_modules\/**\/*"]
   */
  globIgnores?: Array<string>;
  /**
   * @default ["**\/*.{js,css,html}"]
   */
  globPatterns?: Array<string>;
  /**
   * @default true
   */
  globStrict?: boolean;
  // https://github.com/YousefED/typescript-json-schema/issues/424
  // This would ideally be {[key: string]: string | Array<string>}
  templatedURLs?: any;
}

interface InjectPartial {
  /**
   * @default "self.__WB_MANIFEST"
   */
  injectionPoint?: string;
  swSrc: string;
}

interface WebpackPartial {
  chunks?: Array<string>;
  // We can't use the @default annotation here to assign the value via AJV, as
  // an Array<RegExp> can't be serialized into JSON.
  // The default value of [/\.map$/, /^manifest.*\.js$/] will be assigned by
  // the validation function, and we need to reflect that in the docs.
  // This and include should probably be typed to `string | RegExp | Function`
  // instead of `any`, but that also causes validation problems. 
  exclude?: Array<any>;
  excludeChunks?: Array<string>;
  include?: Array<any>;
  mode?: string | null;
}

export interface RequiredSWDestPartial {
  swDest: string;
}

interface WebpackGenerateSWPartial {
  importScriptsViaChunks?: Array<string>;
  /**
   * @default "service-worker.js"
   */
  swDest?: string;
}

interface WebpackInjectManifestPartial {
  /**
   * @default true
   */
  compileSrc?: boolean;
  // This doesn't have a hardcoded default value; instead, the default will be
  // set at runtime to the swSrc basename, with the hardcoded extension .js.
  swDest?: string;
  // This can only be set if compileSrc is true, but that restriction can't be
  // represented in TypeScript. It's enforced via custom runtime validation
  // logic and needs to be documented.
  webpackCompilationPlugins?: Array<any>;
}

export type GenerateSWOptions = BasePartial & GlobPartial & GeneratePartial &
  RequiredSWDestPartial;

export type GetManifestOptions = BasePartial & GlobPartial;

export type InjectManifestOptions = BasePartial & GlobPartial & InjectPartial &
  RequiredSWDestPartial;

export type WebpackGenerateSWOptions = BasePartial & WebpackPartial &
  GeneratePartial & WebpackGenerateSWPartial;

export type WebpackInjectManifestOptions = BasePartial & WebpackPartial &
  InjectPartial & WebpackInjectManifestPartial;

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
