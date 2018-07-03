class RequestCounter {
  constructor(headerName) {
    this.headerName = headerName;
    this.headerCount = {};
    this.urlCount = {};
  }

  count(req) {
    if (this.headerName) {
      const headerValue = req.get(this.headerName);
      if (headerValue !== undefined) {
        if (!(headerValue in this.headerCount)) {
          this.headerCount[headerValue] = 0;
        }
        this.headerCount[headerValue]++;
      }
    }

    const url = req.url;
    if (!(url in this.urlCount)) {
      this.urlCount[url] = 0;
    }
    this.urlCount[url]++;
  }

  getHeaderCount(headerValue) {
    return this.headerCount[headerValue] || 0;
  }

  getUrlCount(url) {
    return this.urlCount[url] || 0;
  }
}

module.exports = RequestCounter;
