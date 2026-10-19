/* Bonaparks light / dark / auto theme, shared by the React site and the static app pages.
   - The visitor's choice ('light' | 'dark' | 'auto', default 'auto') is stored under
     localStorage 'bonaparks-theme'; 'auto' follows prefers-color-scheme live.
   - The resolved theme is written to <html data-theme="light|dark">; colors come from
     /brand/tokens.css, and <meta name="theme-color"> from its --theme-color token.
   - First paint is handled by a copy of applyInline() inlined in each page's <head>;
     this file adds the live listener, the API used by React (window.bonaparksTheme)
     and the segmented control of the static pages ([data-theme-switch]).
   - ?theme=light|dark|auto in the URL forces a theme for that visit (not stored). */
(function () {
  var KEY = 'bonaparks-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  var listeners = [];

  var valid = function (v) { return v === 'light' || v === 'dark' || v === 'auto'; };

  var pref = root.getAttribute('data-theme-pref');
  if (!valid(pref)) {
    pref = 'auto';
    try { var s = localStorage.getItem(KEY); if (valid(s)) pref = s; } catch (e) {}
  }

  var resolve = function (p) {
    return p === 'light' || p === 'dark' ? p : (media && media.matches ? 'light' : 'dark');
  };

  var apply = function () {
    root.setAttribute('data-theme', resolve(pref));
    root.setAttribute('data-theme-pref', pref);
    var meta = document.querySelector('meta[name="theme-color"]');
    var color = getComputedStyle(root).getPropertyValue('--theme-color').trim();
    if (meta && color) meta.setAttribute('content', color);
    for (var i = 0; i < listeners.length; i++) listeners[i](pref);
  };

  var set = function (p) {
    if (!valid(p)) return;
    pref = p;
    try { localStorage.setItem(KEY, p); } catch (e) {}
    apply();
  };

  if (media) {
    var onChange = function () { if (pref === 'auto') apply(); };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  // Another tab changed the choice.
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { pref = valid(e.newValue) ? e.newValue : 'auto'; apply(); }
  });

  window.bonaparksTheme = {
    get: function () { return pref; },
    set: set,
    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (l) { return l !== fn; }); };
    },
  };

  apply();

  /* Segmented control for the static pages: <div data-theme-switch></div>.
     Same markup and behavior as components/ThemeSwitch.tsx. */
  var LABELS = {
    fr: { group: 'Apparence', light: 'Clair', dark: 'Sombre', auto: 'Auto' },
    en: { group: 'Appearance', light: 'Light', dark: 'Dark', auto: 'Auto' },
  };
  var ORDER = ['light', 'dark', 'auto'];

  var mount = function (host) {
    var l = LABELS[(root.lang || 'en').slice(0, 2)] || LABELS.en;
    host.className = 'theme-switch';
    host.setAttribute('role', 'radiogroup');
    host.setAttribute('aria-label', l.group);
    var buttons = ORDER.map(function (value) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.textContent = l[value];
      b.addEventListener('click', function () { set(value); });
      host.appendChild(b);
      return b;
    });
    var sync = function () {
      buttons.forEach(function (b, i) {
        var on = ORDER[i] === pref;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
    };
    host.addEventListener('keydown', function (e) {
      var i = ORDER.indexOf(pref);
      var next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ORDER.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      next = (next + ORDER.length) % ORDER.length;
      set(ORDER[next]);
      buttons[next].focus();
    });
    listeners.push(sync);
    sync();
  };

  var mountAll = function () {
    var hosts = document.querySelectorAll('[data-theme-switch]');
    for (var i = 0; i < hosts.length; i++) mount(hosts[i]);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
