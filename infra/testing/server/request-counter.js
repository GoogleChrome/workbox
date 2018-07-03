class RequestCounter {
  constructor(headerName) {
    this.headerName = headerName;
    this.headerCount = {};
    this.urlCount = {};
  }

  count(ctx) {
    if (this.headerName) {
      const headerValue = ctx.get(this.headerName);
      if (headerValue !== undefined) {
        if (!(headerValue in this.headerCount)) {
          this.headerCount[headerValue] = 0;
        }
        this.headerCount[headerValue]++;
      }
    }

    const url = ctx.request.url;
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
