/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

export default {
  DB_NAME: 'appcache-to-service-worker',
  DB_VERSION: 1,
  STORES: {
    CLIENT_ID_TO_HASH: 'client-to-hash',
    MANIFEST_URL_TO_CONTENTS: 'manifest-url-to-contents',
    PATH_TO_MANIFEST: 'path-to-manifest',
  },
};
