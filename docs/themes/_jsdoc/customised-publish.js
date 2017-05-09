const helper = require('jsdoc/util/templateHelper');

const linktoTutorial = (longName, name) => {
  return tutoriallink(name);
};

const linktoExternal = (longName, name) => {
    return helper.linkto(longName, name.replace(/(^"|"$)/g, ''));
};

const buildMemberNav = (items, itemsSeen, linktoFn) => {
    if (items.length === 0) {
      return [];
    }

    return items.map((item) => {
      const itemNav = {};
      if ( !item.hasOwnProperty('longname') ) {
        itemNav.anchor = linktoFn('', item.name);
      } else if ( !itemsSeen.hasOwnProperty(item.longname) ) {
        var displayName;
        if (env.conf.templates.default.useLongnameInNav) {
          displayName = item.longname;
        } else {
          displayName = item.name;
        }
        itemNav.anchor = linktoFn(item.longname, displayName.replace(/\b(module|event):/g, ''));
        itemsSeen[item.longname] = true;
      }

      return itemNav;
    });
};

const buildNav = (members) => {
  const nav = {};
  const seen = {};
  const seenTutorials = {};

  nav['Modules'] = buildMemberNav(members.modules, {}, helper.linkto);
  nav['Externals'] = buildMemberNav(members.externals, seen, linktoExternal);
  nav['Classes'] = buildMemberNav(members.classes, seen, helper.linkto);
  nav['Events'] = buildMemberNav(members.events, seen, helper.linkto);
  nav['Namespaces'] = buildMemberNav(members.namespaces, seen, helper.linkto);
  nav['Mixins'] = buildMemberNav(members.mixins, seen, helper.linkto);
  nav['Tutorials'] = buildMemberNav(members.tutorials, seenTutorials, linktoTutorial);
  nav['Interfaces'] = buildMemberNav(members.interfaces, seen, helper.linkto);

  if (members.globals.length) {
    var globalNav = [];

    members.globals.forEach(function(g) {
      if ( g.kind !== 'typedef' && !seen.hasOwnProperty(g.longname) ) {
        globalNav.push({
          anchor: helper.linkto(g.longname, g.name)
        });
      }
      seen[g.longname] = true;
    });

    if (globalNav.length > 0) {
      nav['Global'] = globalNav;
    }
  }

  return nav;
};

const moduleNameFilter = (name) => {
  const pieces = name.split('.');
  return pieces[pieces.length - 1] || name;
};

module.exports = {
  buildMemberNav,
  buildNav,
  moduleNameFilter
};
