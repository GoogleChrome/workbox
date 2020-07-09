declare module 'workbox-build' {
  type BuildReturnValue = {
    count: number;
    filePaths: Array<string>;
    size: number;
    warnings: Array<string>;
  };

  export function generateSW(args: any): Promise<BuildReturnValue>;
  export function injectManifest(args: any): Promise<BuildReturnValue>;
  export function copyWorkboxLibraries(dir: string): Promise<string>;
}
