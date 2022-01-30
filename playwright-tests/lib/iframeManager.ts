import {Frame, Page} from '@playwright/test';

const PREFIX = 'iframe-';

export class IframeManager {
  private readonly _page: Page;
  private _count: number;

  constructor(page: Page) {
    this._page = page;
    this._count = 0;
  }

  async createIframeClient(url: string): Promise<Frame> {
    const name = `${PREFIX}${++this._count}`;
    await this._page.evaluate(async (url) => {
      await new Promise<void>((resolve) => {
        const el = document.createElement('iframe');
        el.addEventListener('load', () => {
          resolve();
        });
        el.src = url;
        document.body.appendChild(el);
      });
    }, url);

    const frame = this._page.frame(name);
    if (!frame) {
      throw new Error(`Couldn't find frame with name ${name}`);
    }
    return frame;
  }
}
