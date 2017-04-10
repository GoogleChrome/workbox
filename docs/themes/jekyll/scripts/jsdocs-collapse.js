/* eslint-env browser*/

/**
 * This call simply collapses the docs on the signatures of methods.
 */
class JSDocCollapse {
  /**
   * The class configures the behaviors in the constructor.
   */
  constructor() {
    const collapsingTypes = [
      'method-type-function',
      'method-type-class',
      'member-type-member',
      'member-type-typedef',
    ];
    collapsingTypes.forEach((methodClassname) => {
      const signatureElements =
        document.querySelectorAll(`.collapsing-entry.${methodClassname}`);
      signatureElements.forEach((element) => {
        if (element.querySelector('.js-collapse-details')) {
          this._configureElementBehavior(element);
        }
      });
    });
  }

  /**
   * This method will configure the show and hide behavior of the collapsing
   * sections.
   * @param {DomElement} element The element to configure to show and hide.
   */
  _configureElementBehavior(element) {
    const signatureTitle = element.querySelector('.js-collapse-title');
    const collapseElement = element.querySelector('.js-collapse-details');
    const closedCssClassName = 'is-closed';
    signatureTitle.addEventListener('click', (event) => {
      if (collapseElement.classList.contains(closedCssClassName)) {
        collapseElement.classList.remove(closedCssClassName);
      } else {
        collapseElement.classList.add(closedCssClassName);
      }
    });

    if (signatureTitle.id !== location.hash.substring(1) &&
      !element.classList.contains('start-open')) {
      collapseElement.classList.add(closedCssClassName);
    }
  }
}

window.__npmPublishScripts = window.__npmPublishScripts || {};
window.__npmPublishScripts.JSDocCollapse = JSDocCollapse;
