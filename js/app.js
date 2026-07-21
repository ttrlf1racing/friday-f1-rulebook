/* Progressive enhancements shared by the landing page and rulebook. */
(() => {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const header = $('[data-header]');
  const progress = $('#scroll-progress');
  const backTop = $('.back-top');
  const navToggle = $('.nav-toggle');
  const primaryNav = $('#primary-nav');
  const toast = $('.toast');

  const announce = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  const updateScroll = () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${scrollable > 0 ? (scrollY / scrollable) * 100 : 0}%`;
    header?.classList.toggle('scrolled', scrollY > 16);
    backTop?.classList.toggle('visible', scrollY > 600);
  };
  addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  navToggle?.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    primaryNav?.classList.toggle('open', open);
  });
  $$('#primary-nav a').forEach(link => link.addEventListener('click', () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    primaryNav?.classList.remove('open');
  }));
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  $$('[data-print]').forEach(button => button.addEventListener('click', () => {
    if (!document.body.classList.contains('rules-page')) location.href = 'rules/index.html?print=1';
    else print();
  }));
  if (new URLSearchParams(location.search).get('print') === '1') addEventListener('load', () => setTimeout(print, 350));
  $$('[data-download]').forEach(button => button.addEventListener('click', () => announce('PDF edition coming soon — use Print Rulebook for now.')));

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .08 }) : null;
  $$('.reveal').forEach(element => revealObserver ? revealObserver.observe(element) : element.classList.add('visible'));

  const cards = $$('.rule-card');
  if (!cards.length) return;

  const contentsToggle = $('.contents-toggle');
  const articleNav = $('#article-nav');
  contentsToggle?.addEventListener('click', () => {
    const open = contentsToggle.getAttribute('aria-expanded') !== 'true';
    contentsToggle.setAttribute('aria-expanded', String(open));
    articleNav.classList.toggle('open', open);
    $('span', contentsToggle).textContent = open ? '−' : '+';
  });
  $$('#article-nav a').forEach(link => link.addEventListener('click', () => {
    articleNav.classList.remove('open');
    contentsToggle?.setAttribute('aria-expanded', 'false');
  }));

  const navLinks = new Map($$('#article-nav a').map(link => [link.hash.slice(1), link]));
  const articleObserver = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio).slice(0, 1).forEach(entry => {
      navLinks.forEach(link => link.classList.remove('active'));
      navLinks.get(entry.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-18% 0px -65% 0px', threshold: [0, .25, .5] });
  cards.forEach(card => articleObserver.observe(card));

  const search = $('#rule-search');
  const status = $('#search-status');
  const noResults = $('#no-results');
  let jumpTimer;
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    let firstMatch;
    cards.forEach(card => {
      const matches = !terms.length || terms.every(term => card.textContent.toLocaleLowerCase().includes(term));
      card.hidden = !matches;
      card.classList.remove('search-hit');
      if (matches) { visible += 1; firstMatch ||= card; }
    });
    status.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}`;
    noResults.hidden = visible !== 0;
    clearTimeout(jumpTimer);
    if (query.length >= 3 && firstMatch) {
      firstMatch.classList.add('search-hit');
      jumpTimer = setTimeout(() => firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' }), 450);
    }
  });

  $$('.copy-link').forEach(button => button.addEventListener('click', async () => {
    const card = button.closest('.rule-card');
    const url = `${location.href.split('#')[0]}#${card.id}`;
    try { await navigator.clipboard.writeText(url); announce('Article link copied'); }
    catch { location.hash = card.id; announce('Article link selected'); }
  }));
})();
