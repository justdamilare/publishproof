(() => {
  'use strict';

  const STORAGE_KEY = 'publishproof.license.v1';
  const PRODUCT_ID = 1331021;
  const API_ROOT = 'https://api.lemonsqueezy.com/v1/licenses';
  const CHECK_INTERVAL = 24 * 60 * 60 * 1000;

  function read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function write(value) {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  }

  function belongsToPublishProof(response) {
    return Number(response?.meta?.product_id) === PRODUCT_ID;
  }

  function matchesEmail(response, email) {
    return String(response?.meta?.customer_email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase();
  }

  function isLocallyLicensed() {
    const state = read();
    return Boolean(state?.key && state?.instanceId && state?.status === 'active' && state?.productId === PRODUCT_ID);
  }

  async function request(action, fields) {
    const response = await fetch(`${API_ROOT}/${action}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The licence service could not complete this request.');
    return data;
  }

  function deviceName() {
    const platform = navigator.userAgentData?.platform || navigator.platform || 'Browser';
    const suffix = crypto.randomUUID().slice(0, 8);
    return `PublishProof web — ${platform} — ${suffix}`;
  }

  async function activate(key, email) {
    const cleanKey = String(key || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanKey || !cleanEmail) throw new Error('Enter the licence key and the email used at checkout.');

    const current = read();
    if (current?.key === cleanKey && current?.instanceId) {
      const result = await validate(true);
      if (result.valid) return result;
    }
    if (current?.instanceId) throw new Error('Deactivate the current licence before activating a different one.');

    const result = await request('activate', { license_key: cleanKey, instance_name: deviceName() });
    if (!result.activated || !belongsToPublishProof(result) || !matchesEmail(result, cleanEmail)) {
      if (result.instance?.id) {
        await request('deactivate', { license_key: cleanKey, instance_id: result.instance.id }).catch(() => {});
      }
      if (!belongsToPublishProof(result)) throw new Error('This key is not for PublishProof.');
      if (!matchesEmail(result, cleanEmail)) throw new Error('Use the same email address that appears on the order.');
      throw new Error(result.error || 'This licence could not be activated.');
    }

    const state = {
      key: cleanKey,
      email: cleanEmail,
      instanceId: result.instance.id,
      productId: PRODUCT_ID,
      status: 'active',
      checkedAt: Date.now()
    };
    write(state);
    return { valid: true, state, response: result };
  }

  async function validate(force = false) {
    const state = read();
    if (!state?.key || !state?.instanceId) return { valid: false, reason: 'missing' };
    if (!force && Date.now() - Number(state.checkedAt || 0) < CHECK_INTERVAL) return { valid: state.status === 'active', state };

    try {
      const result = await request('validate', { license_key: state.key, instance_id: state.instanceId });
      const valid = Boolean(result.valid && belongsToPublishProof(result) && matchesEmail(result, state.email));
      write({ ...state, status: valid ? 'active' : 'invalid', checkedAt: Date.now() });
      return { valid, state: read(), response: result, reason: valid ? null : (result.error || 'invalid') };
    } catch (error) {
      return { valid: state.status === 'active', state, offline: true, error };
    }
  }

  async function deactivate() {
    const state = read();
    if (!state?.key || !state?.instanceId) { write(null); return { deactivated: true }; }
    const result = await request('deactivate', { license_key: state.key, instance_id: state.instanceId });
    if (!result.deactivated) throw new Error(result.error || 'This browser could not be deactivated.');
    write(null);
    return result;
  }

  function maskedKey() {
    const key = read()?.key || '';
    return key ? `${key.slice(0, 8)}…${key.slice(-4)}` : '';
  }

  window.PublishProofLicense = { activate, validate, deactivate, read, isLocallyLicensed, maskedKey, productId: PRODUCT_ID };
})();
