(() => {
  const panel = document.getElementById('loading-journey');
  const copy = panel.querySelector('[data-copy]');
  const retry = panel.querySelector('[data-retry]');
  const root = document.getElementById('root');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const currentPath = () => location.pathname.replace(/\/+$/, '') || '/';
  let path = currentPath();
  let delay;
  let reveal;
  let watchdog;
  const clear = () => {
    clearTimeout(delay);
    clearTimeout(reveal);
    clearTimeout(watchdog);
  };
  const release = () => {
    root.inert = false;
    document.documentElement.classList.remove('journey-loading');
  };
  const finish = () => {
    clear();
    release();
    if (panel.hidden) return;
    // Readiness ends the wait immediately; only a short visual fade remains.
    panel.dataset.phase = 'leaving';
    if (reduced.matches) panel.hidden = true;
    else reveal = setTimeout(() => { panel.hidden = true; }, 180);
  };
  const show = () => {
    panel.dataset.phase = 'loading';
    copy.textContent = 'A little moment.';
    retry.hidden = true;
    panel.hidden = false;
    root.inert = true;
    document.documentElement.classList.add('journey-loading');
    watchdog = setTimeout(() => {
      // Motion continues for as long as the room actually needs to load.
      copy.textContent = 'Taking a little longer…';
      retry.hidden = false;
    }, 15000);
  };
  const start = () => {
    clear();
    path = currentPath();
    if (!panel.hidden && panel.dataset.phase !== 'leaving') show();
    else {
      panel.hidden = true;
      release();
      // Fast loads never flash a loader, including the first visit.
      delay = setTimeout(show, 180);
    }
  };
  window.addEventListener('journey:start', start);
  window.addEventListener('journey:ready', (event) => {
    if (event.detail === path) finish();
  });
  start();
})();
