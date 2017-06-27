import errorMessageFactory from './error-message-factory';

/**
 * This is a class for managing errors thrown by Workbox.
 *
 * This class will have full fat error messages in dev builds
 * and be slimmed down in prod.
 */
class WorkboxError extends Error {
  /**
   * Construct a new Workbox Error Message.
   * @param {String} errorCode The error code that is associated with the
   * error message and will be used to generate the appropriate error message.
   * @param {Object} [extras] These are fields that will be passed to
   * the error message to be included if the message wants and exposed
   * under `err.extra` should the developer need to access the information.
   */
  constructor(errorCode, extras) {
    super();

    this.name = errorCode;
    this.message = errorMessageFactory(errorCode, extras);

    if (extras) {
      this.extras = extras;
    }
  }
}

export default WorkboxError;
