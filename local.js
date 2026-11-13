/* Local-only adapter. Original HTML, styling and presentation scripts are preserved. */
window.gtag = function () {};
window.fxTrackInquiry = function () {};
document.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('vallfirest-cookie-choice')) document.querySelector('._cookieBanner')?.classList.add('_cookieBanner--hidden');
  document.querySelectorAll('#CookiePolicyDeclineAll,#CookiePolicyAcceptAll,#CookiePolicySave,#CookiePolicyAcceptAllModal').forEach(button => button.addEventListener('click', () => localStorage.setItem('vallfirest-cookie-choice', button.id)));
  const english = document.documentElement.lang === 'en';
  const message = english ? 'Local preview: this form needs the original server to send your request.' : 'Vista local: este formulario necesita el servidor original para enviar tu solicitud.';
  function notify(text) {
    let box = document.getElementById('local-notice');
    if (!box) {
      box = document.createElement('div'); box.id = 'local-notice'; box.setAttribute('role', 'status');
      document.body.appendChild(box);
    }
    box.textContent = text; box.classList.add('visible');
    clearTimeout(window.localNoticeTimer);
    window.localNoticeTimer = setTimeout(() => box.classList.remove('visible'), 6000);
  }
  let searchIndex;
  async function search(value) {
    value = value.trim(); if (!value) return;
    if (!searchIndex) searchIndex = await fetch('/search-index.json').then(r => r.json());
    let dialog = document.getElementById('local-search');
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'local-search';
      dialog.innerHTML = '<button class="local-close" aria-label="Close">×</button><h2></h2><div class="local-results"></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('button').onclick = () => dialog.close();
      dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    }
    dialog.querySelector('h2').textContent = (english ? 'Search: ' : 'Buscar: ') + value;
    const q = value.toLowerCase();
    let results = searchIndex.filter(p => (p.title + ' ' + p.text).toLowerCase().includes(q)).sort((a,b) => Number(b.title.toLowerCase().includes(q))*10 + Number(b.path.toLowerCase().includes(q))*5 - Number(a.title.toLowerCase().includes(q))*10 - Number(a.path.toLowerCase().includes(q))*5).slice(0, 20);
    const list = dialog.querySelector('.local-results'); list.replaceChildren();
    results.forEach(p => { const a = document.createElement('a'); a.href = p.path; a.textContent = p.title; list.appendChild(a); });
    if (!results.length) list.textContent = english ? 'No results found.' : 'No se han encontrado resultados.';
    dialog.showModal();
  }
  document.addEventListener('submit', function(e) {
    e.preventDefault(); e.stopImmediatePropagation();
    const input = e.target.querySelector('input[type="search"],input[name="search"],input[name="q"],input[name="search-bar"]');
    if (input) search(input.value); else notify(message);
  }, true);
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.ajax-form-submit, #mc-embedded-subscribe, .headerSearch button, .searchBar button');
    if (!button) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const form = button.closest('form') || button.parentElement;
    const input = form.querySelector('input[type="search"],input[name="search"],input[name="q"],input[name="search-bar"]');
    if(input) search(input.value); else notify(message);
  }, true);
  document.querySelectorAll('button:not([aria-label])').forEach(b => { if (!b.textContent.trim()) b.setAttribute('aria-label', b.className.includes('close') ? 'Close' : 'Menu'); });
});
