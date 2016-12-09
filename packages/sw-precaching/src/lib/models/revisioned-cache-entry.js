class RevisionedCacheEntry {
  constructor({revisionID, revision, request}) {
    this.revisionID = revisionID;
    this.revision = revision;
    this.request = request;
  }
}

export default RevisionedCacheEntry;
