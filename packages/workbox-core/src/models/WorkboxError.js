/**
 * Workbox errors should be thrown with this class.
 * This allows use to ensure the type easily in tests,
 * helps developers identify errors from workbox
 * easily and allows use to optimise error
 * messages correctly.
 *
 * @private
 */
export default class WorkboxError extends Error {
  /**
   *
   * @param {String} errorCode The error code that
   * identifies this particular error.
   * @param {Object=} extra Any relevant arguments
   * that will help developers identify issues should
   * be added as a key on the context object.
   */
  constructor(errorCode, extra) {
    let message = errorCode;

    // TODO: Populate error message

    super(message);

    // TODO: Assert errorCode is string
    // TODO: Assert context is object

    this.name = errorCode;
    this.extra = extra;
  }
}
