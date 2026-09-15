/* Prescient Healthcare Services - page behaviour (ported from the design runtime) */
(function () {
  'use strict';
  var root = document;

  /* splash: fade out after 1.9s, then remove from layout */
  var splash = root.querySelector('[data-splash]');
  if (splash) setTimeout(function () {
    splash.classList.add('done');
    setTimeout(function () { splash.style.display = 'none'; }, 800);
  }, 1900);

  /* scroll-reveal */
  var show = function (e) { e.style.opacity = '1'; e.style.transform = 'none'; };
  var hide = function (e) {
    var d = e.getAttribute('data-reveal');
    e.style.opacity = '0';
    e.style.transform = d === 'left' ? 'translateX(-46px)' : d === 'right' ? 'translateX(46px)' : d === 'scale' ? 'scale(.94)' : 'translateY(34px)';
  };
  var els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(show); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var t = en.target;
        if (en.isIntersecting) { t.style.transitionDelay = Math.min((t.__si || 0) * 70, 280) + 'ms'; show(t); }
        else { t.style.transitionDelay = '0ms'; hide(t); }
      });
    }, { threshold: 0.12, rootMargin: '-6% 0px -10% 0px' });
    els.forEach(function (e) {
      var sibs = e.parentElement ? Array.prototype.slice.call(e.parentElement.querySelectorAll(':scope > [data-reveal]')) : [e];
      e.__si = sibs.indexOf(e);
      io.observe(e);
    });
  }

  /* staggered bars / ticks and count-up numbers (after 400ms, as in the original) */
  setTimeout(function () {
    [{ sel: '[data-bar]', step: 90, on: function (e) { e.style.transform = 'scaleY(1)'; } },
     { sel: '[data-tick]', step: 55, on: function (e) { e.style.opacity = '1'; e.style.transform = 'none'; } }
    ].forEach(function (g) {
      var nodes = Array.prototype.slice.call(root.querySelectorAll(g.sel));
      if (!nodes.length) return;
      nodes.forEach(function (n) {
        var sibs = n.parentElement ? Array.prototype.slice.call(n.parentElement.querySelectorAll(g.sel)) : [n];
        n.__gi = sibs.indexOf(n);
      });
      if (!('IntersectionObserver' in window)) { nodes.forEach(g.on); return; }
      var io2 = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.transitionDelay = (en.target.__gi || 0) * g.step + 'ms';
          g.on(en.target); io2.unobserve(en.target);
        });
      }, { threshold: 0.3 });
      nodes.forEach(function (n) { io2.observe(n); });
    });

    var parse = function (txt) {
      var m = txt.match(/^([\s\S]*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
      if (!m) return null;
      var raw = m[2].replace(/,/g, '');
      return { pre: m[1], post: m[3], target: parseFloat(raw), dec: (raw.split('.')[1] || '').length, comma: m[2].indexOf(',') >= 0 };
    };
    var fmt = function (v, p) {
      var s = v.toFixed(p.dec);
      if (p.comma) { var parts = s.split('.'); s = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : ''); }
      return p.pre + s + p.post;
    };
    var run = function (el) {
      if (el.__counted) return;
      el.__counted = true;
      var p = parse(el.textContent.trim());
      if (!p) return;
      var dur = 1600, t0 = performance.now();
      var tick = function (now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(p.target * e, p);
        if (k < 1) requestAnimationFrame(tick); else el.textContent = fmt(p.target, p);
      };
      requestAnimationFrame(tick);
    };
    var counters = root.querySelectorAll('[data-countup]');
    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    var io3 = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { run(en.target); io3.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (n) { io3.observe(n); });
  }, 400);

  /* insights rail */
  var rail = root.querySelector('.rail'), railIdx = null;
  var scrollRail = function (dir) {
    if (!rail) return;
    var card = rail.querySelector('a');
    var step = (card ? card.offsetWidth : rail.clientWidth * 0.8) + 20;
    var max = rail.scrollWidth - rail.clientWidth;
    var last = Math.max(0, Math.ceil(max / step));
    var i = railIdx;
    if (i == null || Math.abs(rail.scrollLeft - i * step) > step * 0.5) i = Math.round(rail.scrollLeft / step);
    var next = Math.min(last, Math.max(0, i + dir));
    railIdx = next;
    rail.scrollTo({ left: Math.min(max, next * step), behavior: 'smooth' });
  };
  var prev = root.querySelector('button[aria-label="Previous articles"]');
  var next = root.querySelector('button[aria-label="Next articles"]');
  if (prev) prev.addEventListener('click', function () { scrollRail(-1); });
  if (next) next.addEventListener('click', function () { scrollRail(1); });

  /* mobile menu */
  var burger = root.querySelector('.nav-burger'), menu = root.getElementById('mobile-menu');
  if (burger && menu) {
    var setOpen = function (open) { menu.hidden = !open; burger.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    burger.addEventListener('click', function () { setOpen(menu.hidden); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  }
})();
