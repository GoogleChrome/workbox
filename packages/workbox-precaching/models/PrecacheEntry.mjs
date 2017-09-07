export default class PrecacheEntry {
/**
 * This class ensures all cache list entries are consistent and
 * adds cache busting if required.
 * @param {*} originalInput
 * @param {string} entryId
 * @param {string} revision
 */
  constructor(originalInput, entryId, revision) {
    this.originalInput = originalInput;
    this.entryId = entryId;
    this.revision = revision;
  }
}
