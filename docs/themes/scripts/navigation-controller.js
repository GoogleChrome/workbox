/* eslint-env browser */

/**
 * This class handles logic for opening and closing the navigation drawer
 */
class NavigationController {
  /**
   * This method sets up the navigation for the site and throws an error is
   * anything can't be completed.
   */
  constructor() {
    this._navDrawer = new window.__npmPublishScripts.NavDrawer();
    // this._jsdocCollapse = new window.__npmPublishScripts.JSDocCollapse();

    this._configureMenuBtn();
    this._configureAnchors();
  }

  /**
   * This sets up the menu btn to open / close the nav drawer.
   */
  _configureMenuBtn() {
    const menuBtn = document.querySelector('.js-menu-btn');
    if(!menuBtn) {
      console.warn('Unable to find js-menu-btn.');
      return;
    }

    menuBtn.addEventListener('click', () => {
      this.toggleNavDrawer();
    });
  }

  /**
   * Use third party anchor-js to add anchors to headings.
   */
  _configureAnchors() {
    const anchorScriptElement = document.querySelector('#anchorjsscript');
    const loadAnchors = () => {
      window.anchors.options = {
        placement: 'left',
      };
      window.anchors.add(
        'main h1, main h2, main h3, main h4, main h5, main h6');
    };
    anchorScriptElement.onload = loadAnchors;
    if (window.anchors) {
      loadAnchors();
    }
  }

  /**
   * This toggles the nav drawer open and closed
   */
  toggleNavDrawer() {
    this._navDrawer.toggle();
  }
}

window.addEventListener('load', function() {
  if (!window.__npmPublishScripts || !window.__npmPublishScripts.NavDrawer) {
    throw new Error('self.__npmPublishScripts.NavDrawer is not defined.');
  }

  window.__npmPublishScripts = window.__npmPublishScripts || {};
  window.__npmPublishScripts.navController = new NavigationController();
});
