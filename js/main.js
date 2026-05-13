/* ── Smooth scroll (Lenis) ── */
const lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ── GSAP ── */
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);

/* ── Cursor ── */
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mx = -200, my = -200, rx = -200, ry = -200;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (dot) gsap.set(dot, { x: mx, y: my });
});

(function loop() {
  if (ring) {
    rx += (mx - rx) * .1;
    ry += (my - ry) * .1;
    gsap.set(ring, { x: rx, y: ry });
  }
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('c-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('c-hover'));
});

/* ── Navigation ── */
const nav    = document.getElementById('nav');
const burger = document.getElementById('burger');
const mNav   = document.getElementById('mobileNav');

window.addEventListener('scroll', () => nav && nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mNav.classList.toggle('open');
    document.body.style.overflow = mNav.classList.contains('open') ? 'hidden' : '';
  });
}

function closeMob() {
  if (burger) burger.classList.remove('open');
  if (mNav) mNav.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Active nav link ── */
const path = window.location.pathname.replace(/\/$/, '') || '/';
document.querySelectorAll('.nav-links a, .mnav-item').forEach(a => {
  const href = a.getAttribute('href').replace(/\/$/, '') || '/';
  if (href === path || (href !== '/' && path.startsWith(href))) a.classList.add('active');
});

/* ── Page Transition ── */
const pt = document.getElementById('pt');

function transitionIn(cb) {
  if (!pt) { cb(); return; }
  gsap.fromTo(pt,
    { scaleY: 0, transformOrigin: 'bottom' },
    { scaleY: 1, duration: .65, ease: 'power3.inOut', onComplete: cb }
  );
}

function transitionOut() {
  if (!pt) return;
  // pt already starts at scaleY(1) via inline style on inner pages — animate it away
  gsap.to(pt, { scaleY: 0, transformOrigin: 'top', duration: .65, ease: 'power3.inOut', delay: .05 });
}

document.querySelectorAll('a').forEach(a => {
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('javascript')) return;
  a.addEventListener('click', e => {
    e.preventDefault();
    closeMob();
    transitionIn(() => { window.location.href = href; });
  });
});

/* ── Preloader ── */
const preloader = document.getElementById('preloader');

// Home page: hide nav until preloader finishes to prevent stutter
if (preloader && nav) gsap.set(nav, { autoAlpha: 0 });

function startReveal() {
  if (!preloader) {
    // Inner pages: animate #pt (already covering screen) away
    transitionOut();
  } else {
    // Home page: ensure #pt is hidden (preloader was on top), then fade nav in
    if (pt) gsap.set(pt, { scaleY: 0 });
    if (nav) gsap.to(nav, { autoAlpha: 1, duration: .5, ease: 'power2.out' });
  }

  /* Intersection observer for reveal classes */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('on'); obs.unobserve(en.target); }
    });
  }, { threshold: .1 });
  document.querySelectorAll('.r, .r-left, .r-right').forEach(el => obs.observe(el));

  /* Parallax */
  document.querySelectorAll('.parallax').forEach(el => {
    gsap.to(el, {
      y: el.dataset.py || '18%',
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* Counter */
  document.querySelectorAll('[data-count]').forEach(el => {
    const cObs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      cObs.unobserve(el);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: +el.dataset.count, duration: 2.2, ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(obj.v) + (el.dataset.suffix || '+'); }
      });
    }, { threshold: .6 });
    cObs.observe(el);
  });

  /* Horizontal drag + touch scroll */
  document.querySelectorAll('.drag-scroll').forEach(track => {
    // Mouse
    let down = false, sx, sl;
    track.style.cursor = 'grab';
    track.addEventListener('mousedown', e => { down = true; sx = e.pageX - track.offsetLeft; sl = track.scrollLeft; track.style.cursor = 'grabbing'; });
    track.addEventListener('mouseleave', () => { down = false; track.style.cursor = 'grab'; });
    track.addEventListener('mouseup',    () => { down = false; track.style.cursor = 'grab'; });
    track.addEventListener('mousemove',  e => {
      if (!down) return;
      track.scrollLeft = sl - (e.pageX - track.offsetLeft - sx) * 1.6;
    });
    // Touch
    let tx = 0, tsl = 0;
    track.addEventListener('touchstart', e => { tx = e.touches[0].pageX; tsl = track.scrollLeft; }, { passive: true });
    track.addEventListener('touchmove',  e => { track.scrollLeft = tsl - (e.touches[0].pageX - tx) * 1.2; }, { passive: true });
  });

  /* Magnetic buttons */
  document.querySelectorAll('.magnet').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .22, duration: .4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.5)' }));
  });

  /* Hero line reveals (if present) */
  document.querySelectorAll('.hero-word').forEach((w, i) => {
    gsap.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: 'power4.out', delay: .3 + i * .12 });
  });
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) gsap.fromTo(heroSub, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: .9 });
  const heroCtx = document.querySelector('.hero-cta');
  if (heroCtx) gsap.fromTo(heroCtx, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: 1.2 });
}

if (preloader) {
  const tl = gsap.timeline({
    onComplete: () => gsap.to(preloader, { opacity: 0, duration: .5, onComplete: () => { preloader.style.display = 'none'; startReveal(); } })
  });
  tl.to('.pre-wordmark', { opacity: 1, y: 0, duration: .55, ease: 'power2.out' }, .15)
    .to('.pre-fill',     { width: '100%', duration: 1, ease: 'power2.inOut' }, .3);
} else {
  startReveal();
}
