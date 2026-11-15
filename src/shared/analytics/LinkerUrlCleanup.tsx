// This inline head script runs before the afterInteractive Google tag. Capture
// native replaceState so cosmetic cleanup cannot emit an extra history page_view.
const installer = String.raw`
(() => {
  const replaceState = window.history.replaceState;
  let analyticsReady = false;
  function clean() {
    if (!analyticsReady) return;
    const parts = window.location.search.slice(1).split('&');
    const remaining = parts.filter(part => {
      try { return decodeURIComponent(part.split('=', 1)[0].replace(/\+/g, ' ')) !== '_gl'; }
      catch { return true; }
    });
    if (remaining.length === parts.length) return;
    const query = remaining.some(Boolean) ? '?' + remaining.join('&') : '';
    replaceState.call(window.history, window.history.state, '', window.location.pathname + query + window.location.hash);
  }
  window.__yutoLinkerUrlReady = function () { analyticsReady = true; clean(); };
  for (const event of ['pageshow', 'popstate', 'hashchange']) window.addEventListener(event, clean);
  document.addEventListener('click', function (event) {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const target = new URL(anchor.href, window.location.href);
    if (target.origin === window.location.origin && target.pathname === window.location.pathname && target.hash) {
      // Run after all click/linker handlers and native hash navigation. Do not
      // cancel propagation or strip parameters from cross-domain destinations.
      window.setTimeout(clean, 0);
    }
  });
})();`;

export function LinkerUrlCleanup() {
  return <script id="portfolio-linker-url-cleanup" dangerouslySetInnerHTML={{ __html: installer }} />;
}

export function linkerReadyAfterAnalytics(measurementId: string) {
  const id = JSON.stringify(measurementId);
  // Reads are queued after the existing config command. Never use a timeout to
  // delete an incoming linker before GA has resolved its client/session values.
  return `gtag('get', ${id}, 'client_id', function (clientId) {
  if (!clientId) return;
  gtag('get', ${id}, 'session_id', function (sessionId) {
    if (sessionId && window.__yutoLinkerUrlReady) window.__yutoLinkerUrlReady();
  });
});`;
}
