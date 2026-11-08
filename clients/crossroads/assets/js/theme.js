/* Apply before styles paint, including when navigating between pages. */
(() => {
  let theme = 'dark';
  try {
    const saved = localStorage.getItem('crossroads-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch (_) { /* Appearance still works when storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#f7f6f2' : '#141716';
})();
