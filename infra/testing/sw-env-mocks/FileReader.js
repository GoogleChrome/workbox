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
