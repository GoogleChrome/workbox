/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

const serializableProperties = [
  'method',
  'body',
  'referrer',
  'referrerPolicy',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'integrity',
  'keepalive',
  'signal',
];


export default async (request) => {
  const requestObj = {headers: {}};

  // Set the body, if used.
  if (request.bodyUsed) {
    requestObj.body = await request.text();
  }

  // Convert the headers from an iterable to an object.
  for (const [key, value] of request.headers.entries()) {
    requestObj.headers[key] = value;
  }

  // Add all other serializable request properties
  for (const prop of serializableProperties) {
    if (request[prop] != null) {
      requestObj[prop] = request[prop];
    }
  }

  return requestObj;
};
