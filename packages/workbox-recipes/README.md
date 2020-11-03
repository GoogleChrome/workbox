This module's documentation can be found at https://developers.google.com/web/tools/workbox/modules/workbox-recipes

### Basic sample

```js
import {
  PageCache,
  ImageCache,
  StaticResourceCache,
  GoogleFontsCache,
  OfflineFallback,
} from 'workbox-recipes';
import { precacheAndRoute } from 'workbox-precaching';

// Include offline.html in the manifest
precacheAndRoute(self.__WB_MANIFEST);

new PageCache();

new StaticResourceCache();

new ImageCache();

new GoogleFontsCache();

new OfflineFallback();
```
