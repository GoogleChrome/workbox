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
function atLeastOne(a){const b=Object.keys(a);if(!b.some(c=>a[c]!==void 0))throw Error('Please set at least one of the following parameters: '+b.map(c=>`'${c}'`).join(', '))}function hasMethod(a,b){const c=Object.keys(a).pop(),d=typeof a[c][b];if('function'!=d)throw Error(`The '${c}' parameter must be an object that exposes `+`a '${b}' method.`)}function isInstance(a,b){const c=Object.keys(a).pop();if(!(a[c]instanceof b))throw Error(`The '${c}' parameter must be an instance of `+`'${b.name}'`)}function isOneOf(a,b){const c=Object.keys(a).pop();if(!b.includes(a[c]))throw Error(`The '${c}' parameter must be set to one of the `+`following: ${b}`)}function isType(a,b){const c=Object.keys(a).pop(),d=typeof a[c];if(d!==b)throw Error(`The '${c}' parameter has the wrong type. `+`(Expected: ${b}, actual: ${d})`)}function isSWEnv(){return'ServiceWorkerGlobalScope'in self&&self instanceof ServiceWorkerGlobalScope}function isValue(a,b){const c=Object.keys(a).pop(),d=a[c];if(d!==b)throw Error(`The '${c}' parameter has the wrong value. `+`(Expected: ${b}, actual: ${d})`)}var assert={atLeastOne,hasMethod,isInstance,isOneOf,isType,isSWEnv,isValue};class Behavior{constructor({statuses:a,headers:b}={}){assert.atLeastOne({statuses:a,headers:b}),a!==void 0&&assert.isInstance({statuses:a},Array),b!==void 0&&assert.isType({headers:b},'object'),this.statuses=a,this.headers=b}cacheWillUpdate({response:a}={}){return this.isResponseCacheable({response:a})}isResponseCacheable({response:a}={}){assert.isInstance({response:a},Response);let b=!0;return this.statuses&&(b=this.statuses.includes(a.status)),this.headers&&b&&(b=Object.keys(this.headers).some(c=>{return a.headers.get(c)===this.headers[c]})),b}}export{Behavior};