(() => {
  const panel = document.getElementById('loading-journey');
  const count = panel.querySelector('[data-count]');
  const copy = panel.querySelector('[data-copy]');
  const retry = panel.querySelector('[data-retry]');
  const root = document.getElementById('root');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const currentPath = () => location.pathname.replace(/\/+$/, '') || '/';
  let path = currentPath();
  let started = performance.now();
  const visited = new Set();
  let ready = false;
  let shown = true;
  let tick;
  let reveal;
  let delay;
  let watchdog;
  const clear = () => {
    clearInterval(tick);
    clearTimeout(reveal);
    clearTimeout(delay);
    clearTimeout(watchdog);
  };
  const finish = () => {
    if (panel.dataset.phase === 'arrived' || panel.dataset.phase === 'leaving') return;
    clear();
    count.textContent = '00';
    copy.textContent = 'You’re here.';
    panel.dataset.phase = 'arrived';
    reveal = setTimeout(() => {
      panel.dataset.phase = 'leaving';
      reveal = setTimeout(() => {
        panel.hidden = true;
        root.inert = false;
        document.documentElement.classList.remove('journey-loading');
        shown = false;
      }, reduced.matches ? 0 : 1750);
    }, reduced.matches ? 0 : 460);
  };
  const update = () => {
    const elapsed = performance.now() - started;
    const step = Math.min(2, Math.floor(elapsed / 600));
    count.textContent = String(3 - step).padStart(2, '0');
    copy.textContent = ['Let the outside fall away.', 'Follow a little warmth.', 'Something opens.'][step];
    // This is an arrival countdown, not a fabricated download percentage.
    // Hold at 01 until the destination has actually mounted/rendered.
    if (ready && (reduced.matches || elapsed >= 1800)) finish();
  };
  const show = () => {
    shown = true;
    started = performance.now();
    panel.hidden = false;
    panel.dataset.phase = 'counting';
    retry.hidden = true;
    root.inert = true;
    document.documentElement.classList.add('journey-loading');
    update();
    tick = setInterval(update, 100);
    watchdog = setTimeout(() => {
      clearInterval(tick);
      copy.textContent = 'Taking a little longer. Your room is still on its way.';
      retry.hidden = false;
    }, 15000);
  };
  window.addEventListener('journey:start', () => {
    clear();
    path = currentPath();
    ready = false;
    // A cached room should open immediately, without flashing a loader.
    if (!shown && visited.has(path) && !['/weather', '/witness'].includes(path)) return;
    if (shown) show();
    else delay = setTimeout(show, 180);
  });
  window.addEventListener('journey:ready', (event) => {
    if (event.detail !== path) return;
    visited.add(path);
    ready = true;
    if (!shown) { clearTimeout(delay); return; }
    update();
  });
  show();
})();
