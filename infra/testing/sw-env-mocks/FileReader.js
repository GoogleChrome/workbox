/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// FileReader
// https://w3c.github.io/FileAPI/#APIASynch
class FileReader {
  readAsText(blob /* , label */) {
    try {
      this.result = blob._text;
      this.onloadend();
    } catch (err) {
      this.error = err;
      this.onerror();
    }
  }
}

module.exports = FileReader;
