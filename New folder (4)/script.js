(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme: init from saved or system, allow toggle
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)');
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme ? savedTheme : (prefersLight.matches ? 'light' : 'dark');
  setTheme(initialTheme);
  themeToggle?.addEventListener('click', () => setTheme(root.classList.contains('light') ? 'dark' : 'light'));
  prefersLight.addEventListener?.('change', e => {
    const userSet = localStorage.getItem('theme');
    if (!userSet) setTheme(e.matches ? 'light' : 'dark');
  });

  function setTheme(mode){
    if (mode === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('theme', mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#faf7ff' : '#0f1020');
  }

  // Intro (mirsiyam-like)
  const intro = document.getElementById('intro');
  const skipIntro = document.getElementById('introSkip');
  const introSeen = sessionStorage.getItem('intro_seen') === '1';
  if (intro && !introSeen) {
    const show = () => { intro.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const hide = () => { intro.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    const done = () => { sessionStorage.setItem('intro_seen', '1'); hide(); };
    setTimeout(show, 120);
    const timer = setTimeout(done, 2600);
    skipIntro?.addEventListener('click', ()=>{ clearTimeout(timer); done(); });
    intro.addEventListener('click', (e)=>{ if(e.target === intro){ clearTimeout(timer); done(); } });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && intro.getAttribute('aria-hidden') === 'false'){ clearTimeout(timer); done(); } });
  }

  // Mobile nav toggle
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.setAttribute('aria-expanded', String(!expanded));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.setAttribute('aria-expanded', 'false');
    }));
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Active nav link on scroll
  const sections = Array.from(document.querySelectorAll('main .section, .hero')).map(el => ({
    id: el.getAttribute('id') || 'home', el
  }));
  let activeId = 'home';
  const updateActive = () => {
    let current = 'home';
    const scrollY = window.scrollY + 120;
    for (const {id, el} of sections) {
      if (el.offsetTop <= scrollY) current = id;
    }
    if (current !== activeId) {
      activeId = current;
      document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${activeId}`));
    }
  };
  updateActive();
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);

  // Card tilt effect
  const tilts = document.querySelectorAll('.tilt');
  tilts.forEach(card => {
    let rect;
    const maxTilt = 10; // degrees
    const enter = () => { rect = card.getBoundingClientRect(); };
    const move = (x, y) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (x - rect.left) / rect.width - 0.5;
      const py = (y - rect.top) / rect.height - 0.5;
      const rx = (+py * maxTilt).toFixed(2);
      const ry = (-px * maxTilt).toFixed(2);
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const reset = () => { card.style.transform = 'rotateX(0) rotateY(0)'; };

    card.addEventListener('pointerenter', e => { card.setPointerCapture(e.pointerId); enter(); });
    card.addEventListener('pointermove', e => move(e.clientX, e.clientY));
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const btn = card.querySelector('.open-project'); btn?.click(); e.preventDefault(); } });
  });

  // Project filters and show more
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('#projectsGrid .project-card');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
    const cat = btn.getAttribute('data-filter');
    projectCards.forEach(card => {
      const cats = (card.getAttribute('data-cat') || '').split(' ');
      const isMatch = cat === 'all' || cats.includes(cat);
      card.style.display = isMatch ? '' : 'none';
    });
  }));

  const showMoreBtn = document.getElementById('showMore');
  showMoreBtn?.addEventListener('click', () => {
    document.querySelectorAll('#projectsGrid .more').forEach(el => el.classList.remove('more'));
    showMoreBtn.remove();
  });

  // Project modal
  const modal = document.getElementById('projectModal');
  const titleEl = document.getElementById('projectTitle');
  const descEl = document.getElementById('projectDesc');
  const galleryEl = document.getElementById('projectGallery');
  let lastFocused;

  function openModal(data){
    lastFocused = document.activeElement;
    if (!modal || !titleEl || !descEl || !galleryEl) return;
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
    galleryEl.innerHTML = '';
    const samples = {
      g: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop stop-color='%237c3aed'/%3E%3Cstop stop-color='%23fbbf24' offset='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3C/svg%3E",
      g2: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0' x2='1'%3E%3Cstop stop-color='%23fbbf24'/%3E%3Cstop stop-color='%237c3aed' offset='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g2)' width='100%25' height='100%25'/%3E%3C/svg%3E",
      g3: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0' x2='1'%3E%3Cstop stop-color='%235b21b6'/%3E%3Cstop stop-color='%23b45309' offset='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g3)' width='100%25' height='100%25'/%3E%3C/svg%3E"
    };
    data.images.forEach(key => {
      const wrap = document.createElement('div');
      wrap.className = 'img';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = data.title + ' preview';
      img.src = samples[key] || samples.g;
      wrap.appendChild(img);
      galleryEl.appendChild(wrap);
    });

    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close')?.focus();
  }
  function closeModal(){
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus?.();
  }

  document.querySelectorAll('.open-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-project]');
      if (!card) return;
      try {
        const data = JSON.parse(card.getAttribute('data-project'));
        openModal(data);
      } catch {}
    });
  });
  modal?.addEventListener('click', e => { if ((e.target).hasAttribute?.('data-close')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal(); });

  // Testimonials carousel
  const track = document.querySelector('.carousel-track');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  let index = 0; let timer;
  function updateCarousel(){
    if (!track) return;
    const width = track.clientWidth;
    track.scrollTo({ left: index * width, behavior: 'smooth' });
  }
  function next(){ index = (index + 1) % 3; updateCarousel(); }
  function prev(){ index = (index + 2) % 3; updateCarousel(); }
  nextBtn?.addEventListener('click', next);
  prevBtn?.addEventListener('click', prev);
  const start = () => { stop(); timer = setInterval(next, 4500); };
  const stop = () => { if (timer) clearInterval(timer); };
  start();
  track?.addEventListener('mouseenter', stop);
  track?.addEventListener('mouseleave', start);
  window.addEventListener('resize', updateCarousel);

  // Animate skill bars on view
  const bars = document.querySelectorAll('#skills .bar');
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target; const level = Number(el.getAttribute('data-level') || '0');
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `#skills .bar[data-level=\"${level}\"]::after{transform:scaleX(${level/100})}`;
        document.head.appendChild(styleTag);
        el.classList.add('meter-animate');
        barObserver.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => barObserver.observe(b));

  // Contact form
  const form = document.getElementById('contactForm');
  const statusEl = document.querySelector('.form-status');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const errors = [];
    if (!data.name || String(data.name).trim().length < 2) errors.push('Name');
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) errors.push('Email');
    if (!data.message || String(data.message).trim().length < 10) errors.push('Message');
    if (errors.length) {
      statusEl && (statusEl.textContent = 'Please check: ' + errors.join(', '));
      return;
    }
    statusEl && (statusEl.textContent = 'Thanks! I\'ll get back to you soon.');
    form.reset();
  });

  // Copy email
  const copyBtn = document.getElementById('copyEmail');
  copyBtn?.addEventListener('click', async () => {
    const email = copyBtn.getAttribute('data-email') || '';
    try { await navigator.clipboard.writeText(email); copyBtn.textContent = 'Copied!'; setTimeout(() => copyBtn.textContent = 'Copy email', 1500); } catch {}
  });
})();
