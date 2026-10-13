/* =========================================================
   SyncReach – interactions
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const format = (v) => (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US')) + suffix;

    if (prefersReduced) { el.textContent = format(target); return; }

    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Reveal on scroll + counters ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      $$('[data-count]', entry.target).forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach((el) => io.observe(el));

  // Hero visual: animate chart + counters shortly after page load
  const heroVisual = $('#heroVisual');
  if (heroVisual) {
    setTimeout(() => {
      heroVisual.classList.add('in');
      $$('[data-count]', heroVisual).forEach(countUp);
    }, 500);
  }

  /* ---------- Scroll: progress bar, navbar, back-to-top, parallax ---------- */
  const progress = $('#scrollProgress');
  const nav = $('#mainNav');
  const toTop = $('#toTop');
  const parallaxEls = $$('[data-speed]');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (!prefersReduced) {
      parallaxEls.forEach((el) => {
        el.style.transform = 'translate3d(0,' + (y * parseFloat(el.dataset.speed)).toFixed(1) + 'px,0)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));

  /* ---------- Active nav link (scroll spy) ---------- */
  const links = $$('.nav-pill .nav-link');
  const linkMap = new Map(links.map((a) => [a.getAttribute('href'), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.remove('active'));
      const link = linkMap.get('#' + entry.target.id);
      if (link) link.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  // Close mobile menu after clicking a link
  const navMenu = $('#navMenu');
  links.forEach((a) => a.addEventListener('click', () => {
    if (navMenu && navMenu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
  }));

  /* ---------- Hero mouse-parallax (desktop only) ---------- */
  if (heroVisual && !prefersReduced && window.matchMedia('(hover: hover)').matches) {
    const layers = $$('[data-depth]', heroVisual);
    heroVisual.addEventListener('mousemove', (e) => {
      const r = heroVisual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth);
        l.style.transform = 'translate3d(' + (x * d).toFixed(1) + 'px,' + (y * d).toFixed(1) + 'px,0)';
      });
    });
    heroVisual.addEventListener('mouseleave', () => layers.forEach((l) => (l.style.transform = '')));
  }

  /* ---------- Card spotlight (follows the cursor) ---------- */
  $$('.spot').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* =========================================================
     REVIEWS WALL – columns scroll up / down / up / down
     ========================================================= */
  function initReviews() {
    const wall = $('#reviewWall');
    const colsEl = $('#reviewCols');
    if (!wall || !colsEl) return;

    /* ---------------------------------------------------------
       YOUR REVIEWS – edit / add / remove freely (aim for 8+)
       type:   'text' | 'image' | 'video'
       img:    (image cards)  path to a screenshot, e.g. 'img/review-1.jpg'
       thumb:  (video cards)  optional poster image for the video
       video:  (video cards)  YouTube / Vimeo EMBED url, e.g.
               'https://www.youtube.com/embed/XXXXXXXX'
       avatar: optional profile photo, otherwise initials are shown
       Tip: keep text and video cards alternating for a nice rhythm.
       --------------------------------------------------------- */
    const REVIEWS = [
      { type: 'text',  name: 'Smith Walker',   handle: '@smithwal',      text: 'These guys have changed the game for us when it comes to cold email. Their support is incredible, responsive and always one step ahead.' },
      { type: 'video', name: 'Aron',           handle: '@aron',          text: 'Please watch the video.', video: '', thumb: '' },
      { type: 'text',  name: 'Norman farrar',  handle: '@normanfarrar',  text: 'The follow-up system alone generated conversations we would\u2019ve missed. Great experience working with the team.' },
      { type: 'video', name: 'Andry',          handle: '@andry',         text: 'Please watch the video.', video: '', thumb: '' },
      { type: 'text',  name: 'James Carter',   handle: '@jamesc',        text: 'Clear weekly reporting and a steady flow of qualified meetings. Exactly what we were looking for.' },
      { type: 'video', name: 'Joshua Craig',   handle: '@joshcraig',     text: 'Please watch the video.', video: '', thumb: '' },
      { type: 'text',  name: 'Chris Anderson', handle: '@chrisanderson', text: 'SyncReach handles all aspects of email infrastructure setup, from DNS records to email account import and warm-up.' },
      { type: 'video', name: 'Sofia',          handle: '@sofia',         text: 'Please watch the video.', video: '', thumb: '' }
    ];

    /* ---------- helpers ---------- */
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const initials = (n) => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const STARS = '<div class="stars" aria-label="5 out of 5 stars">' + '<i class="bi bi-star-fill"></i>'.repeat(5) + '</div>';
    const TAGS = {
      text:  ['bi-fonts', 'Text'],
      image: ['bi-image', 'Image'],
      video: ['bi-camera-video', 'Video']
    };

    function cardHTML(r, i, clone) {
      const type = TAGS[r.type] ? r.type : 'text';
      const tab = clone ? ' tabindex="-1"' : '';
      const tag = TAGS[type];

      let media = '';
      if (type === 'video') {
        media =
          '<button type="button" class="rv-media rv-video-btn t-' + (i % 3) + '"' + tab +
          ' aria-label="Play video review from ' + esc(r.name) + '">' +
          (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="" loading="lazy">' : '') +
          '<span class="rv-play"><i class="bi bi-play-fill"></i></span></button>';
      } else if (type === 'image') {
        media = r.img
          ? '<div class="rv-media"><img src="' + esc(r.img) + '" alt="Review from ' + esc(r.name) + '" loading="lazy"></div>'
          : '<div class="rv-media rv-ph" aria-hidden="true"><i class="bi bi-image"></i></div>';
      }

      const avatar = r.avatar
        ? '<img class="avatar" src="' + esc(r.avatar) + '" alt="" loading="lazy">'
        : '<span class="avatar av-' + ((i % 7) + 1) + '" aria-hidden="true">' + esc(initials(r.name)) + '</span>';

      return (
        '<article class="rv-card" data-name="' + esc(r.name) + '" data-video="' + esc(r.video || '') + '">' +
          '<header class="rv-head">' + avatar +
            '<div class="rv-who"><strong>' + esc(r.name) + '</strong><small>' + esc(r.handle) + '</small></div>' +
            '<span class="type-tag"><i class="bi ' + tag[0] + '"></i>' + tag[1] + '</span>' +
          '</header>' +
          media +
          '<p class="rv-text">\u201C' + esc(r.text) + '\u201D</p>' +
          STARS +
        '</article>'
      );
    }

    /* ---------- build columns (4 / 3 / 2 / 1 depending on screen width) ---------- */
    const columnCount = () => {
      const w = window.innerWidth;
      return w >= 992 ? 4 : w >= 768 ? 3 : w >= 576 ? 2 : 1;
    };

    let current = 0;
    function build() {
      const cols = columnCount();
      if (cols === current) return;
      current = cols;
      wall.style.setProperty('--rv-cols', cols);

      const len = REVIEWS.length;
      // each column starts on a different review, so neighbours never match
      const per = Math.min(len, Math.max(3, Math.ceil(len / cols) + 1));
      let html = '';

      for (let c = 0; c < cols; c++) {
        const start = Math.round((c * len) / cols);
        let set = '', clone = '';
        for (let k = 0; k < per; k++) {
          const idx = (start + k) % len;
          set += cardHTML(REVIEWS[idx], idx, false);
          clone += cardHTML(REVIEWS[idx], idx, true);
        }
        html +=
          '<div class="rv-col"><div class="rv-track">' +
            '<div class="rv-set">' + set + '</div>' +
            '<div class="rv-set" aria-hidden="true">' + clone + '</div>' +   // duplicate = seamless loop
          '</div></div>';
      }
      colsEl.innerHTML = html;
    }
    build();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });

    /* ---------- pause animation while the wall is off-screen ---------- */
    new IntersectionObserver((entries) => {
      wall.classList.toggle('is-off', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(wall);

    /* ---------- video modal (event delegation, keeps working after rebuilds) ---------- */
    const modalEl = $('#videoModal');
    const box = $('#videoBox');
    const title = $('#videoModalLabel');

    if (modalEl) {
      // clear the player on close, which also stops playback
      modalEl.addEventListener('hidden.bs.modal', () => { box.innerHTML = ''; });
    }

    colsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.rv-video-btn');
      if (!btn || !modalEl) return;

      const card = btn.closest('.rv-card');
      const url = (card.dataset.video || '').trim();
      title.textContent = card.dataset.name + ' \u2013 client review';
      box.textContent = '';

      if (/^https:\/\//i.test(url)) {
        const frame = document.createElement('iframe');
        frame.src = url;
        frame.title = 'Client video review';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture';
        frame.allowFullscreen = true;
        box.appendChild(frame);
      } else {
        box.innerHTML =
          '<div class="d-grid text-center text-muted p-4" style="place-content:center">' +
          '<i class="bi bi-camera-video fs-1 mb-2"></i>' +
          '<small>Add your video embed link in the <code>video</code> field of this review in <code>main.js</code>.</small></div>';
      }
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });
  }
  initReviews();

  /* ---------- Performance gallery (generated analytics cards) ---------- */
  function seeded(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function chartSVG(id, seed, color) {
    const rnd = seeded(seed);
    const pts = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const base = 0.35 + 0.3 * Math.sin(i * 0.7 + seed) ;
      pts.push(Math.max(0.12, Math.min(0.92, base + (rnd() - 0.5) * 0.35)));
    }
    const W = 300, H = 90;
    const coords = pts.map((v, i) => [(i / (n - 1)) * W, H - v * H]);
    const line = coords.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
    const area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#g' + id + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  const perfData = [
    { t: '5 Days · Client #3', a: ['48.5K', '0.6%', '275', '124'], c: '#2563eb' },
    { t: '5 Days · Client #5', a: ['12.4K', '1.2%', '149', '38'], c: '#6366f1' },
    { t: '5 Days · Client #2', a: ['22.4K', '0.9%', '201', '64'], c: '#0ea5e9' },
    { t: '5 Days · Client #9', a: ['31.0K', '0.8%', '248', '72'], c: '#2563eb' },
    { t: '5 Days · Client #7', a: ['18.2K', '1.1%', '196', '51'], c: '#7c3aed' }
  ];

  function buildRow(target, offset) {
    if (!target) return;
    let html = '';
    for (let loop = 0; loop < 2; loop++) {            // duplicated for a seamless infinite loop
      perfData.forEach((d, i) => {
        const idx = (i + offset) % perfData.length;
        const p = perfData[idx];
        const id = target.id + loop + i;
        html += '<div class="perf-card">' +
          '<div class="perf-head"><strong>' + p.t + '</strong><span>Last 5 days</span></div>' +
          '<div class="perf-stats">' +
            '<div><b>' + p.a[0] + '</b><small>Sent</small></div>' +
            '<div><b>' + p.a[1] + '</b><small>Replies</small></div>' +
            '<div><b>' + p.a[2] + '</b><small>Positive</small></div>' +
            '<div><b>' + p.a[3] + '</b><small>Meetings</small></div>' +
          '</div>' + chartSVG(id, 7 + idx * 5 + offset, p.c) +
          '<div class="perf-overlay"><span><i class="bi bi-bar-chart-line-fill"></i>Campaign analytics</span></div>' +
        '</div>';
      });
    }
    target.innerHTML = html;
  }
  buildRow($('#marqueeA'), 0);
  buildRow($('#marqueeB'), 2);

  /* ---------- Contact form (validation + demo submit) ---------- */
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

      const btn = $('#sendBtn');
      const label = $('span', btn);
      btn.disabled = true;
      label.textContent = 'Sending…';

      /* TODO: connect to your backend / Formspree / EmailJS here, e.g.
         fetch('https://formspree.io/f/XXXX', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }) */
      setTimeout(() => {
        btn.classList.add('sent');
        label.textContent = 'Message sent — we\'ll reply within 24 hours';
        form.reset();
        form.classList.remove('was-validated');
        setTimeout(() => {
          btn.classList.remove('sent');
          btn.disabled = false;
          label.textContent = 'Send message';
        }, 4000);
      }, 900);
    });
  }
})();