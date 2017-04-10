/* eslint-env browser*/

/**
 * This class just handles the state and UI of the navigation drawer.
 */
class NavDrawer {
  /**
   * Constructing the nav drawer will look for known elements and throw
   * if there is anything missing.
   */
  constructor() {
    this._navDrawer = document.querySelector('.js-nav-drawer');
    this._backdrop = document.querySelector('.js-nav-backdrop');
    if (!this._navDrawer) {
      throw new Error('Unable to find the js-nav-drawer.');
    }
    if (!this._backdrop) {
      throw new Error('Unable to find the js-nav-backdrop.');
    }

    this.CLASSNAMES = {
      IS_OPEN: 'is-open',
    };

    this._detabinator = new window.Detabinator(this._navDrawer);
    this._addClickHandlers();
  }

  /**
   * Add handlers so that clicks on the nav drawer and / or the backdrop
   * closes the nav drawer.
   */
  _addClickHandlers() {
    const clickHandler = () => {
      this.close();
    };
    this._navDrawer.addEventListener('click', clickHandler);
    this._backdrop.addEventListener('click', clickHandler);
  }

  /**
   * @return {boolean} Returns true if the drawer is currently open.
   */
  isOpen() {
    return this._navDrawer.classList.contains(this.CLASSNAMES.IS_OPEN);
  }

  /**
   * This toggles the navdrawer open and closed
   */
  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Opens the nav drawer
   */
  open() {
    this._detabinator.inert = false;

    this._navDrawer.classList.add(this.CLASSNAMES.IS_OPEN);
    this._backdrop.classList.add(this.CLASSNAMES.IS_OPEN);
  }

  /**
   * Closes the nav drawer
   */
  close() {
    this._detabinator.inert = true;

    this._navDrawer.classList.remove(this.CLASSNAMES.IS_OPEN);
    this._backdrop.classList.remove(this.CLASSNAMES.IS_OPEN);
  }
}

window.__npmPublishScripts = window.__npmPublishScripts || {};
window.__npmPublishScripts.NavDrawer = NavDrawer;
