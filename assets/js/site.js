/* Tsahim-Ur — site behaviour: language (EN/MN), navigation, contact form and motion. */
(function () {
  'use strict';

  var I18N = window.I18N || { en: {}, mn: {} };
  var SITE = (window.SITE_URL || 'https://tsahimur.mn').replace(/\/+$/, '');
  var PAGE = document.body.getAttribute('data-page') || 'home';
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- Language ---------- */
  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; } }
  function langFromUrl() {
    var l = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    return l === 'en' || l === 'mn' ? l : null;
  }
  function t(lang, key) {
    var v = I18N[lang] && I18N[lang][key];
    if (typeof v !== 'string') v = I18N.en[key];
    return typeof v === 'string' ? v : null;
  }
  // page links only: not #anchors, mailto:, tel: or other sites
  var internalLinks = $$('a[href]').filter(function (a) { return !/^(#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(a.getAttribute('href')); });
  var fromDisk = location.protocol === 'file:'; // opened from a file explorer, no web server
  function setMeta(sel, attr, val) { var el = $(sel); if (el) el.setAttribute(attr, val); }

  // Wrap every word of a heading in a mask so it can rise into view.
  function splitWords(el) {
    function wrapText(text, parentCls) {
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var m = document.createElement('span'); m.className = 'mask';
        var w = document.createElement('span'); w.className = 'hw' + (parentCls ? ' ' + parentCls : ''); w.textContent = part;
        m.appendChild(w); frag.appendChild(m);
      });
      return frag;
    }
    var out = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) out.appendChild(wrapText(n.textContent));
      else if (n.nodeName === 'BR') out.appendChild(n.cloneNode());
      else if (n.nodeType === 1) out.appendChild(wrapText(n.textContent, n.className));
    });
    el.innerHTML = '';
    el.appendChild(out);
  }

  function applyLang(lang) {
    root.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var v = t(lang, el.getAttribute('data-i18n'));
      if (v !== null) el.innerHTML = v;
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      var v = t(lang, el.getAttribute('data-i18n-aria'));
      if (v !== null) el.setAttribute('aria-label', v);
    });
    $$('[data-split]').forEach(splitWords);
    $$('[data-lang-label]').forEach(function (el) { el.textContent = lang === 'en' ? 'MN' : 'EN'; });
    // keep the chosen language on internal links
    internalLinks.forEach(function (a) {
      var url = new URL(a.href);
      url.searchParams.set('lang', lang);
      if (fromDisk && /\/$/.test(url.pathname)) url.pathname += 'index.html';
      a.setAttribute('href', fromDisk ? url.href : url.pathname + url.search + url.hash);
    });
    // SEO
    var title = t(lang, 'seo_' + PAGE + '_title'), desc = t(lang, 'seo_' + PAGE + '_desc');
    if (title) { document.title = title; setMeta('meta[property="og:title"]', 'content', title); setMeta('meta[name="twitter:title"]', 'content', title); }
    if (desc) { setMeta('meta[name="description"]', 'content', desc); setMeta('meta[property="og:description"]', 'content', desc); setMeta('meta[name="twitter:description"]', 'content', desc); }
    setMeta('meta[property="og:locale"]', 'content', lang === 'mn' ? 'mn_MN' : 'en_US');
    store('tsahimur_lang', lang);
    var params = new URLSearchParams(location.search); params.set('lang', lang);
    try { history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash); } catch (e) { /* some browsers block this on file:// */ }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  var lang = langFromUrl() || store('tsahimur_lang') || 'en';
  if (lang !== 'en' && lang !== 'mn') lang = 'en';
  applyLang(lang);
  $$('[data-lang-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { lang = lang === 'en' ? 'mn' : 'en'; applyLang(lang); });
  });

  /* ---------- Navigation ---------- */
  var year = $('[data-year]'); if (year) year.textContent = new Date().getFullYear();
  var menuBtn = $('[data-menu-btn]'), mobileNav = $('[data-mobile-nav]');
  if (menuBtn && mobileNav) menuBtn.addEventListener('click', function () {
    var open = mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 100); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Contact form: builds a pre-filled email ---------- */
  var form = $('[data-contact-form]');
  if (form) {
    $$('[data-pick-group]', form).forEach(function (group) {
      var multi = group.getAttribute('data-pick-group') === 'multi';
      $$('.pick', group).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!multi) $$('.pick', group).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' && multi ? 'false' : 'true');
        });
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // spaces alone do not count as filled in
      $$('.inp', form).forEach(function (el) { el.value = el.value.trim(); });
      if (!form.reportValidity()) return;
      var v = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var picked = function (g) { return $$('[data-pick-group="' + g + '"] .pick[aria-pressed="true"]', form).map(function (b) { return b.textContent.trim(); }); };
      var body = [
        'Name: ' + v('name'), 'Company: ' + v('company'), 'Email: ' + v('email'),
        'Interested in: ' + (picked('multi').join(', ') || '-'), 'Start: ' + (picked('single').join('') || '-'), '', v('message')
      ].join('\n');
      var subject = 'Project enquiry' + (v('company') ? ' — ' + v('company') : '');
      location.href = 'mailto:hello@tsahimur.mn?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------- Motion ---------- */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || reduced) return;
  if (ST) gsap.registerPlugin(ST);

  var intro = gsap.timeline({ delay: 0.1 });
  intro.from('.site-header', { y: -30, opacity: 0, duration: 1, ease: 'expo.out' }, 0)
    .from('[data-split] .hw', { yPercent: 115, duration: 1.25, stagger: 0.05, ease: 'expo.out' }, 0.1)
    .from('[data-fade]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' }, 0.45);

  // Re-run the headline rise after switching language
  document.addEventListener('langchange', function () {
    gsap.from('[data-split] .hw', { yPercent: 115, duration: 0.9, stagger: 0.04, ease: 'expo.out' });
  });

  if (ST) {
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-stagger]').forEach(function (el, i) {
      gsap.from(el, { y: 60, opacity: 0, duration: 1.2, delay: (i % 3) * 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }

  // Hero: the logo assembles itself, then stays alive
  var mark = $('[data-mark]');
  if (mark) {
    var conns = $$('[data-conn]', mark);
    conns.forEach(function (p) { var len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
    gsap.timeline({ delay: 0.2 })
      .from($$('[data-node]', mark), { scale: 0, transformOrigin: '50% 50%', duration: 0.9, stagger: 0.07, ease: 'back.out(2.2)' }, 0.2)
      .to(conns, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power3.inOut' }, 0.4)
      .from($$('[data-silver]', mark), { scale: 0, transformOrigin: '50% 50%', duration: 1.1, stagger: 0.12, ease: 'elastic.out(1, 0.5)' }, 1.15);
    $$('[data-pulse]', mark).forEach(function (c, i) {
      gsap.fromTo(c, { scale: 1, opacity: 0.8, transformOrigin: '50% 50%' }, { scale: 2.1, opacity: 0, duration: 2.6, ease: 'power2.out', repeat: -1, delay: 2.2 + i * 0.65, repeatDelay: 1.4 });
    });
    gsap.to($$('[data-silver]', mark), { scale: 1.08, transformOrigin: '50% 50%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.9, delay: 2.4 });
    gsap.to(mark, { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    if (ST) gsap.to('[data-tilt]', { yPercent: 16, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Counters
  $$('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count'), o = { v: end > 1000 && end < 2100 ? end - 40 : 0 };
    gsap.to(o, { v: end, duration: 2, delay: 0.9, ease: 'power3.out', onUpdate: function () { el.textContent = String(Math.round(o.v)); } });
  });

  // Marquee
  var mq = $('[data-marquee]');
  if (mq) gsap.to(mq, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });

  // Process path
  var pathSec = $('[data-path-sec]');
  if (pathSec && ST) {
    gsap.fromTo('[data-pathline]', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: pathSec, start: 'top 70%', end: 'bottom 75%', scrub: 0.8 } });
    $$('.step', pathSec).forEach(function (el, i) {
      gsap.from(el.querySelector('.step-node'), { scale: 0, duration: 0.8, ease: 'back.out(2.5)', scrollTrigger: { trigger: pathSec, start: 'top ' + (70 - i * 9) + '%', once: true } });
      gsap.from(Array.prototype.slice.call(el.children, 1), { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: pathSec, start: 'top ' + (68 - i * 9) + '%', once: true } });
    });
  }

  // Pointer effects: cursor, magnetic buttons, hero spotlight and logo tilt
  if (fine) {
    var dot = $('.cursor'), ring = $('.cursor-ring');
    var hero = $('.hero'), tilt = $('[data-tilt]');
    if (dot && ring) {
      root.classList.add('has-cursor');
      gsap.set([dot, ring], { x: -100, y: -100 });
      var dx = gsap.quickTo(dot, 'x', { duration: 0.12 }), dy = gsap.quickTo(dot, 'y', { duration: 0.12 });
      var rx = gsap.quickTo(ring, 'x', { duration: 0.5 }), ry = gsap.quickTo(ring, 'y', { duration: 0.5 });
    }
    window.addEventListener('mousemove', function (e) {
      if (dx) {
        dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
        var hit = e.target.closest && e.target.closest('a, button, input, textarea');
        gsap.to(ring, { scale: hit ? 1.8 : 1, backgroundColor: hit ? 'rgba(134,54,223,0.15)' : 'rgba(134,54,223,0)', duration: 0.35, overwrite: 'auto' });
      }
      if (hero) { var r = hero.getBoundingClientRect(); hero.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      if (tilt) gsap.to(tilt, { rotationY: (e.clientX / innerWidth - 0.5) * 18, rotationX: -(e.clientY / innerHeight - 0.5) * 14, transformPerspective: 1000, duration: 1.2, ease: 'power3', overwrite: 'auto' });
    });
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.25); yTo((e.clientY - (r.top + r.height / 2)) * 0.35); });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  // Smooth scrolling
  if (window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.2, easing: function (x) { return Math.min(1, 1.001 - Math.pow(2, -10 * x)); }, anchors: { offset: -90 } });
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  if (ST && document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
