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

  /* ---------- Video review modal ---------- */
  const modalEl = $('#videoModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    const box = $('#videoBox');
    const title = $('#videoModalLabel');

    $$('.review-video').forEach((card) => {
      $('.video-thumb', card).addEventListener('click', () => {
        const url = (card.dataset.video || '').trim();      // put a YouTube/Vimeo EMBED url in data-video=""
        title.textContent = card.dataset.name + ' – client review';
        box.innerHTML = url
          ? '<iframe src="' + url + '" title="Client video review" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
          : '<div class="d-grid place-items-center text-center text-muted p-4" style="place-content:center"><i class="bi bi-camera-video fs-1 mb-2"></i><small>Add your video embed link in the <code>data-video</code> attribute of this review card.</small></div>';
        modal.show();
      });
    });
    modalEl.addEventListener('hidden.bs.modal', () => { box.innerHTML = ''; });   // stops playback
  }

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
