(() => {
  'use strict';
  const t = (key, variables) => window.PublishProofI18n?.t(key, variables) || key;

  const params = new URLSearchParams(location.search);
  let handoff = {};
  try { handoff = JSON.parse(sessionStorage.getItem('publishproof.pendingActivation.v1') || '{}'); } catch { handoff = {}; }
  sessionStorage.removeItem('publishproof.pendingActivation.v1');
  const email = params.get('email') || handoff.email || '';
  const key = params.get('license_key') || handoff.key || '';
  if (location.search) history.replaceState({}, '', location.pathname);

  let preferredLanguage = 'en';
  try { preferredLanguage = localStorage.getItem('publishproof.language.v1') || 'en'; } catch { /* English remains the fallback. */ }
  if (preferredLanguage === 'de' && !location.pathname.includes('/de/')) {
    sessionStorage.setItem('publishproof.pendingActivation.v1', JSON.stringify({ email, key }));
    location.replace('de/willkommen.html');
    return;
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#welcomeEmail').value = email;
    document.querySelector('#welcomeKey').value = key;
    document.querySelectorAll('.language-switcher a').forEach(link => link.addEventListener('click', () => {
      localStorage.setItem('publishproof.language.v1', link.lang || 'en');
      sessionStorage.setItem('publishproof.pendingActivation.v1', JSON.stringify({
        email: document.querySelector('#welcomeEmail').value,
        key: document.querySelector('#welcomeKey').value
      }));
    }));
    document.querySelector('#welcomeLicenseForm').addEventListener('submit', async event => {
      event.preventDefault();
      const message = document.querySelector('#welcomeMessage');
      const button = document.querySelector('#welcomeActivate');
      message.className = 'activation-message'; message.textContent = t('Activating this browser…'); button.disabled = true;
      try {
        await PublishProofLicense.activate(document.querySelector('#welcomeKey').value, document.querySelector('#welcomeEmail').value);
        sessionStorage.removeItem('publishproof.pendingActivation.v1');
        message.classList.add('success'); message.textContent = t('Licence active. Opening your workspace…');
        location.href = 'index.html#workspace';
      } catch (error) {
        message.classList.add('error'); message.textContent = error.message; button.disabled = false;
      }
    });
  });
})();
