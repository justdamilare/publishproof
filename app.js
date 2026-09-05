(() => {
  'use strict';
  const t = (key, variables) => window.PublishProofI18n?.t(key, variables) || key;

  const STORAGE_KEY = 'publishproof.records.v1';
  const form = document.querySelector('#recordForm');
  const recordsView = document.querySelector('#recordsView');
  const newView = document.querySelector('#newView');
  const recordsList = document.querySelector('#recordsList');
  const emptyState = document.querySelector('#emptyState');
  const decisionCard = document.querySelector('#decisionCard');
  const decisionTitle = document.querySelector('#decisionTitle');
  const decisionText = document.querySelector('#decisionText');
  const fileInput = document.querySelector('#assetFile');
  const fileLabel = document.querySelector('#fileLabel');
  const searchInput = document.querySelector('#recordSearch');
  const licenseApi = window.PublishProofLicense;
  const TRIAL_KEY = 'publishproof.trialUsed.v1';
  const DELETIONS_KEY = 'publishproof.deletions.v1';
  const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
  const MAX_BACKUP_RECORDS = 5000;
  const STRING_FIELDS = ['id', 'createdAt', 'updatedAt', 'client', 'campaign', 'title', 'channel', 'publicationDate', 'publicationUrl', 'contentType', 'aiUse', 'aiTool', 'aiVersion', 'reviewer', 'reviewDate', 'labelText', 'labelPlacement', 'evidenceLink', 'owner', 'notes', 'fileName', 'fileHash', 'recordHash'];
  const BOOLEAN_FIELDS = ['realistic', 'couldMislead', 'publicInterest', 'humanReviewed', 'editorialResponsibility', 'machineMark', 'visibleLabel'];
  let fileEvidence = null;
  let toastTimer;

  const sampleRecord = {
    id: 'PP-SAMPLE', createdAt: '2026-08-31T10:30:00.000Z', client: 'Northstar Coffee', campaign: 'Autumn product launch',
    title: 'Launch film — 30s cut', channel: 'Instagram', publicationDate: '2026-09-12', publicationUrl: '',
    contentType: 'video', aiUse: 'generated', aiTool: 'Adobe Firefly', aiVersion: 'Image 4', realistic: true,
    couldMislead: true, publicInterest: false, humanReviewed: true, editorialResponsibility: true, machineMark: true,
    visibleLabel: true, reviewer: 'Creative Director', reviewDate: '2026-08-30',
    labelText: 'Selected scenes in this film were generated using AI.', labelPlacement: 'On-screen at first exposure and in caption',
    evidenceLink: '', owner: 'Account Lead', notes: 'Product appearance was checked against approved photography. AI was used for the surrounding environment only.',
    fileName: 'northstar-launch-final.mp4', fileSize: 18420392, fileHash: '9f7a8f3e11d1d618f3bc5b669927f7e20ab23e55444109a1324bc29fe4aac21d',
    decision: { status: 'action', code: 'potential-deepfake', title: 'Visible disclosure recommended', text: 'The answers describe generated or manipulated realistic media that could appear authentic. Record a clear, perceivable disclosure at first exposure.' }
  };
  if (window.PublishProofI18n?.language === 'de') Object.assign(sampleRecord, {
    campaign: 'Herbst-Produkteinführung', title: 'Launch-Film — 30-Sekunden-Version',
    labelText: 'Ausgewählte Szenen in diesem Film wurden mithilfe von KI erzeugt.',
    labelPlacement: 'Auf dem Bildschirm bei der ersten Wahrnehmung und in der Bildunterschrift',
    reviewer: 'Kreativdirektion', owner: 'Kundenbetreuung',
    notes: 'Das Erscheinungsbild des Produkts wurde mit freigegebenen Fotos abgeglichen. KI wurde nur für die Umgebung verwendet.',
    decision: { ...sampleRecord.decision, title: t('Visible disclosure recommended'), text: t('The answers describe generated or manipulated realistic media that could appear authentic. Record a clear, perceivable disclosure at first exposure.') }
  });

  function loadRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(records) ? records : [];
    }
    catch { return []; }
  }

  function saveRecords(records) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch { throw new Error(t('This browser could not save the records. Export a backup or free some device storage.')); }
  }

  function loadDeletions() {
    try {
      const deletions = JSON.parse(localStorage.getItem(DELETIONS_KEY) || '{}');
      return deletions && typeof deletions === 'object' && !Array.isArray(deletions) ? deletions : {};
    } catch { return {}; }
  }

  function markDeleted(recordId, deletedAt = new Date().toISOString()) {
    const deletions = loadDeletions();
    deletions[recordId] = deletedAt;
    const entries = Object.entries(deletions).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).slice(0, MAX_BACKUP_RECORDS);
    localStorage.setItem(DELETIONS_KEY, JSON.stringify(Object.fromEntries(entries)));
  }

  function clearDeletion(recordId) {
    const deletions = loadDeletions();
    if (!deletions[recordId]) return;
    delete deletions[recordId];
    localStorage.setItem(DELETIONS_KEY, JSON.stringify(deletions));
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function showView(view) {
    const isNew = view === 'new';
    const isLicense = view === 'license';
    const isAccount = view === 'account';
    recordsView.classList.toggle('active', !isNew && !isLicense && !isAccount);
    newView.classList.toggle('active', isNew);
    document.querySelector('#licenseView').classList.toggle('active', isLicense);
    document.querySelector('#accountView')?.classList.toggle('active', isAccount);
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (isNew) setTimeout(() => form.elements.client.focus(), 50);
  }

  function hasUsedTrial() {
    return localStorage.getItem(TRIAL_KEY) === 'true' || loadRecords().some(record => record.id !== sampleRecord.id);
  }

  function canCreateRecord() {
    return licenseApi.isLocallyLicensed() || !hasUsedTrial();
  }

  function startNewRecord() {
    if (!canCreateRecord()) {
      showView('license');
      showToast(t('Activate an agency licence to create unlimited records.'));
      return;
    }
    showView('new');
  }

  function updateAccessUI() {
    const licensed = licenseApi.isLocallyLicensed();
    const trialUsed = hasUsedTrial();
    document.querySelector('#licenceTrialState').hidden = licensed;
    document.querySelector('#licenceActiveState').hidden = !licensed;
    document.querySelector('#licenseForm').hidden = licensed;
    document.querySelector('#licencePill').textContent = licensed ? t('Licensed') : trialUsed ? t('Trial used') : t('Trial');
    document.querySelector('#licenceNavText').textContent = licensed ? t('Licence active') : t('Activate licence');
    document.querySelector('#maskedLicenceKey').textContent = licensed ? licenseApi.maskedKey() : '';
    document.querySelector('#usageNote').textContent = licensed ? t('Agency licence active — unlimited records.') : trialUsed ? t('Your free record has been used. Activate a licence to save another.') : t('Your first publication record is free.');
  }

  function formState() {
    const data = Object.fromEntries(new FormData(form).entries());
    ['realistic', 'couldMislead', 'publicInterest', 'humanReviewed', 'editorialResponsibility', 'machineMark', 'visibleLabel'].forEach(name => {
      data[name] = form.elements[name].checked;
    });
    return data;
  }

  function assess(data) {
    if (!data.contentType || !data.aiUse) {
      return { status: 'pending', code: 'incomplete', title: t('Complete the AI contribution fields'), text: t('PublishProof will show a conservative workflow recommendation here.') };
    }
    if (data.aiUse === 'none') {
      return { status: 'clear', code: 'no-ai', title: t('No AI-specific disclosure indicated'), text: t('The record says no AI was used. Keep the record if it supports a client or internal assurance process.') };
    }
    if (data.contentType === 'interactive') {
      return { status: 'action', code: 'interactive-ai', title: t('First-interaction disclosure recommended'), text: t('Interactive AI should clearly tell natural persons that they are interacting with an AI system, unless the artificial nature is genuinely obvious.') };
    }
    if (['image', 'video', 'audio', 'mixed'].includes(data.contentType) && ['generated', 'manipulated'].includes(data.aiUse) && data.realistic && data.couldMislead) {
      return { status: 'action', code: 'potential-deepfake', title: t('Visible disclosure recommended'), text: t('The answers describe generated or manipulated realistic media that could appear authentic. Record a clear, perceivable disclosure at first exposure.') };
    }
    if (data.contentType === 'text' && ['generated', 'manipulated'].includes(data.aiUse) && data.publicInterest) {
      if (data.humanReviewed && data.editorialResponsibility) {
        return { status: 'clear', code: 'editorial-exception', title: t('Record the human-review exception'), text: t('The answers indicate human review plus editorial responsibility. Preserve the reviewer, date, scope, and rationale supporting that conclusion.') };
      }
      return { status: 'action', code: 'public-interest-text', title: t('Visible disclosure recommended'), text: t('AI-generated or manipulated public-interest text may require disclosure unless both human review/editorial control and editorial responsibility apply.') };
    }
    if (['generated', 'manipulated'].includes(data.aiUse)) {
      return { status: 'pending', code: 'document-and-review', title: t('Document the output and confirm scope'), text: t('These answers do not trigger the narrow deployer paths above. Retain any provider marking, document human review, and confirm the context before publication.') };
    }
    return { status: 'clear', code: 'assistive', title: t('Document the assistive scope'), text: t('Minor assistive editing may fall outside the relevant labelling paths when it does not substantially alter input data or meaning. Preserve what changed and who checked it.') };
  }

  function updateDecision() {
    const decision = assess(formState());
    decisionCard.className = `decision-card ${decision.status}`;
    decisionTitle.textContent = decision.title;
    decisionText.textContent = decision.text;
    if (form.elements.visibleLabel.checked && !form.elements.labelText.value) {
      const suggestions = {
        'interactive-ai': t('You are interacting with an AI system.'),
        'potential-deepfake': t('This content was generated or manipulated using AI.'),
        'public-interest-text': t('This text was generated or manipulated using AI.')
      };
      if (suggestions[decision.code]) form.elements.labelText.value = suggestions[decision.code];
    }
  }

  async function fingerprint(file) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function formatBytes(bytes) {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  async function hashText(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function renderRecords() {
    const records = loadRecords();
    const query = searchInput.value.trim().toLowerCase();
    const filtered = records.filter(record => [record.client, record.campaign, record.title, record.channel].some(value => String(value || '').toLowerCase().includes(query)));
    document.querySelector('#recordCount').textContent = records.length;
    document.querySelector('#metricTotal').textContent = records.length;
    document.querySelector('#metricReviewed').textContent = records.filter(record => record.humanReviewed).length;
    document.querySelector('#metricLabels').textContent = records.filter(record => record.visibleLabel).length;
    emptyState.classList.toggle('hidden', records.length > 0);
    recordsList.hidden = records.length === 0;
    recordsList.innerHTML = filtered.map(record => {
      const status = record.decision?.status === 'action' ? t('Action recorded') : record.humanReviewed ? t('Reviewed') : t('Needs review');
      const statusClass = record.decision?.status === 'action' && !record.visibleLabel ? 'action' : '';
      return `<article class="record-row">
        <div class="record-icon">${escapeHtml((record.contentType || 'R')[0].toUpperCase())}</div>
        <div><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.client)} · ${escapeHtml(record.campaign)}</small></div>
        <div><strong>${escapeHtml(t(record.channel || '—'))}</strong><small>${escapeHtml(record.publicationDate || t('Date not set'))}</small></div>
        <div><span class="status-pill ${statusClass}">${escapeHtml(status)}</span><small>${escapeHtml(record.decision?.title || t('Assessment pending'))}</small></div>
        <div class="row-actions"><button class="icon-button" type="button" data-action="print" data-id="${escapeHtml(record.id)}" title="${escapeHtml(t('Print or save PDF'))}">↗</button><button class="icon-button" type="button" data-action="delete" data-id="${escapeHtml(record.id)}" title="${escapeHtml(t('Delete record'))}">×</button></div>
      </article>`;
    }).join('');
    if (records.length && !filtered.length) recordsList.innerHTML = `<div class="empty-state"><h4>${escapeHtml(t('No matching records.'))}</h4><p>${escapeHtml(t('Try a different client, campaign, or channel.'))}</p></div>`;
  }

  function download(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    const text = String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }

  function cleanImportedRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(t('The backup contains an invalid record.'));
    const record = Object.create(null);
    STRING_FIELDS.forEach(field => {
      if (value[field] == null) return;
      const text = String(value[field]);
      if (text.length > 20000) throw new Error(t('The backup contains a field that is too large.'));
      record[field] = text;
    });
    if (!/^PP-[A-Z0-9-]{1,64}$/i.test(record.id || '')) throw new Error(t('The backup contains an invalid record identifier.'));
    BOOLEAN_FIELDS.forEach(field => { record[field] = Boolean(value[field]); });
    const size = Number(value.fileSize || 0);
    record.fileSize = Number.isFinite(size) && size >= 0 ? Math.min(size, Number.MAX_SAFE_INTEGER) : 0;
    const decision = value.decision;
    if (decision && typeof decision === 'object' && !Array.isArray(decision)) {
      record.decision = {
        status: String(decision.status || '').slice(0, 32),
        code: String(decision.code || '').slice(0, 64),
        title: String(decision.title || '').slice(0, 500),
        text: String(decision.text || '').slice(0, 5000)
      };
    }
    return record;
  }

  function printRecord(record) {
    const windowRef = window.open('', '_blank');
    if (!windowRef) { showToast(t('Allow pop-ups to export the evidence pack.')); return; }
    const fields = [
      [t('Client / brand'), record.client], [t('Campaign'), record.campaign], [t('Asset'), record.title], [t('Channel'), record.channel],
      [t('Publication date'), record.publicationDate || t('Not set')], [t('Content type'), t(({text:'Text',image:'Image',video:'Video',audio:'Audio',interactive:'Interactive AI / chatbot',mixed:'Mixed media'})[record.contentType] || record.contentType)], [t('AI contribution'), t(({none:'No AI used',assistive:'Assistive edit only',generated:'Generated substantive content',manipulated:'Manipulated existing content'})[record.aiUse] || record.aiUse)],
      [t('AI system'), [record.aiTool, record.aiVersion].filter(Boolean).join(' — ') || t('Not recorded')], [t('Human review'), record.humanReviewed ? t('Completed by {reviewer}{date}', { reviewer: record.reviewer || t('unnamed reviewer'), date: record.reviewDate ? t(' on {date}', { date: record.reviewDate }) : '' }) : t('Not recorded')],
      [t('Editorial responsibility'), record.editorialResponsibility ? t('Recorded') : t('Not recorded')], [t('Provider marking retained'), record.machineMark ? t('Yes') : t('Not recorded')],
      [t('Visible / audible disclosure'), record.visibleLabel ? t('Yes') : t('No')], [t('Disclosure wording'), record.labelText || t('Not recorded')], [t('Placement / timing'), record.labelPlacement || t('Not recorded')],
      [t('File'), record.fileName ? `${record.fileName} (${formatBytes(record.fileSize)})` : t('No file fingerprinted')], ['SHA-256', record.fileHash || t('Not recorded')], [t('Record integrity hash'), record.recordHash || t('Not available')]
    ];
    const rows = fields.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    windowRef.document.write(`<!doctype html><html lang="${escapeHtml(window.PublishProofI18n?.language || 'en')}"><head><meta charset="utf-8"><title>${escapeHtml(record.id)} — PublishProof</title><style>body{font-family:Arial,sans-serif;color:#102018;margin:48px;line-height:1.45}header{border-bottom:3px solid #102018;padding-bottom:20px;margin-bottom:28px}h1{font-size:36px;margin:0}.brand{font-weight:800;color:#102018}.tag{display:inline-block;margin:12px 0;padding:6px 10px;border:1px solid #102018;border-radius:99px;background:#d9ff55;font-size:11px;font-weight:800}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:11px;border-bottom:1px solid #ccd2ce;text-align:left;vertical-align:top;font-size:12px}th{width:30%;text-transform:uppercase;letter-spacing:.06em;font-size:9px}.assessment{padding:20px;border:1px solid #102018;background:#f3f0e8}.notes{white-space:pre-wrap}footer{margin-top:36px;padding-top:18px;border-top:1px solid #102018;color:#647068;font-size:9px}@media print{body{margin:16mm}}</style></head><body><header><div class="brand">${escapeHtml(t('PublishProof / evidence record'))}</div><h1>${escapeHtml(record.title)}</h1><div class="tag">${escapeHtml(record.decision?.title || t('Assessment pending'))}</div></header><section class="assessment"><strong>${escapeHtml(t('Workflow assessment'))}</strong><p>${escapeHtml(record.decision?.text || '')}</p></section><table>${rows}</table><h2>${escapeHtml(t('Notes and rationale'))}</h2><p class="notes">${escapeHtml(record.notes || t('No notes recorded.'))}</p><footer>${escapeHtml(t('Generated {date}. PublishProof is a workflow and recordkeeping aid, not legal advice. Source: European Commission guidelines on Article 50 transparency obligations, published 20 July 2026.', { date: new Date().toISOString() }))}</footer></body></html>`);
    windowRef.document.close();
    setTimeout(() => windowRef.print(), 100);
  }

  document.querySelectorAll('[data-scroll-workspace]').forEach(button => button.addEventListener('click', () => document.querySelector('#workspace').scrollIntoView({ behavior: 'smooth' })));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  ['#newRecordTop', '#emptyCreate'].forEach(selector => document.querySelector(selector).addEventListener('click', startNewRecord));
  document.querySelectorAll('[data-scroll-license]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('#workspace').scrollIntoView({ behavior: 'smooth' });
    showView('license');
  }));
  document.querySelector('#cancelRecord').addEventListener('click', () => showView('records'));
  searchInput.addEventListener('input', renderRecords);
  form.addEventListener('input', updateDecision);
  form.addEventListener('change', updateDecision);

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) { fileEvidence = null; fileLabel.innerHTML = `<b>${escapeHtml(t('Select a file'))}</b> ${escapeHtml(t('or drop it here. Only a SHA-256 fingerprint is retained.'))}`; return; }
    fileLabel.textContent = t('Fingerprinting {name}…', { name: file.name });
    try {
      const hash = await fingerprint(file);
      fileEvidence = { fileName: file.name, fileSize: file.size, fileHash: hash };
      fileLabel.innerHTML = `<b>${escapeHtml(file.name)}</b> · ${escapeHtml(formatBytes(file.size))} · SHA-256 ${escapeHtml(hash.slice(0, 12))}…`;
    } catch {
      fileEvidence = null; fileLabel.textContent = t('Could not fingerprint this file. You can still save the record.');
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!canCreateRecord()) {
      showView('license');
      showToast(t('Activate an agency licence to save another record.'));
      return;
    }
    const data = formState();
    const decision = assess(data);
    const createdAt = new Date().toISOString();
    const record = { id: `PP-${Date.now().toString(36).toUpperCase()}`, createdAt, updatedAt: createdAt, ...data, ...(fileEvidence || {}), decision };
    record.recordHash = await hashText(JSON.stringify(record));
    const records = loadRecords(); records.unshift(record);
    try { saveRecords(records); }
    catch (error) { showToast(error.message); return; }
    if (!licenseApi.isLocallyLicensed()) localStorage.setItem(TRIAL_KEY, 'true');
    clearDeletion(record.id);
    document.dispatchEvent(new CustomEvent('publishproof:record-upsert', { detail: { record } }));
    form.reset(); fileEvidence = null; fileLabel.innerHTML = `<b>${escapeHtml(t('Select a file'))}</b> ${escapeHtml(t('or drop it here. Only a SHA-256 fingerprint is retained.'))}`;
    updateDecision(); renderRecords(); updateAccessUI(); showView('records'); showToast(t('Publication record saved on this device.'));
  });

  recordsList.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const records = loadRecords(); const record = records.find(item => item.id === button.dataset.id);
    if (!record) return;
    if (button.dataset.action === 'print') printRecord(record);
    if (button.dataset.action === 'delete' && window.confirm(t('Delete “{title}” from this device?', { title: record.title }))) {
      saveRecords(records.filter(item => item.id !== record.id));
      markDeleted(record.id);
      document.dispatchEvent(new CustomEvent('publishproof:record-delete', { detail: { recordId: record.id } }));
      renderRecords(); showToast(t('Record deleted.'));
    }
  });

  document.querySelector('#loadSample').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.some(record => record.id === sampleRecord.id)) { records.unshift(sampleRecord); saveRecords(records); clearDeletion(sampleRecord.id); document.dispatchEvent(new CustomEvent('publishproof:record-upsert', { detail: { record: sampleRecord } })); renderRecords(); showToast(t('Sample record added.')); }
    else showToast(t('The sample is already in your workspace.'));
  });

  document.querySelector('#exportJson').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) { showToast(t('Create a record before exporting.')); return; }
    download(`publishproof-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), records }, null, 2), 'application/json');
  });

  document.querySelector('#exportCsv').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) { showToast(t('Create a record before exporting.')); return; }
    const fields = ['id','createdAt','client','campaign','title','channel','publicationDate','contentType','aiUse','aiTool','humanReviewed','reviewer','visibleLabel','labelText','labelPlacement','fileName','fileHash','recordHash'];
    const csv = [fields.join(','), ...records.map(record => fields.map(field => csvCell(record[field])).join(','))].join('\n');
    download(`publishproof-records-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
  });

  document.querySelector('#importJson').addEventListener('click', () => document.querySelector('#importFile').click());
  document.querySelector('#importFile').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error(t('Choose a PublishProof backup smaller than 5 MB.'));
      const backup = JSON.parse(await file.text());
      if (backup?.schema !== 1 || !Array.isArray(backup.records)) throw new Error(t('Choose a PublishProof JSON backup.'));
      if (backup.records.length > MAX_BACKUP_RECORDS) throw new Error(t('This backup contains too many records.'));
      const importedRecords = backup.records.map(cleanImportedRecord);
      if (!licenseApi.isLocallyLicensed() && importedRecords.filter(record => record.id !== sampleRecord.id).length > 1) {
        showView('license');
        throw new Error(t('Activate your agency licence to restore a multi-record backup.'));
      }
      const existing = loadRecords();
      const merged = [...importedRecords, ...existing].filter((record, index, records) => record?.id && records.findIndex(item => item.id === record.id) === index);
      saveRecords(merged);
      importedRecords.forEach(record => clearDeletion(record.id));
      document.dispatchEvent(new CustomEvent('publishproof:records-sync'));
      if (merged.some(record => record.id !== sampleRecord.id)) localStorage.setItem(TRIAL_KEY, 'true');
      renderRecords(); updateAccessUI(); showToast(t(importedRecords.length === 1 ? '{count} backup record restored.' : '{count} backup records restored.', { count: importedRecords.length }));
    } catch (error) {
      showToast(error.message || t('This backup could not be restored.'));
    } finally {
      event.target.value = '';
    }
  });

  document.querySelector('#licenseForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.querySelector('#activateLicence');
    const message = document.querySelector('#activationMessage');
    button.disabled = true; message.className = 'activation-message'; message.textContent = t('Activating this browser…');
    try {
      await licenseApi.activate(document.querySelector('#licenseKey').value, document.querySelector('#licenseEmail').value);
      message.classList.add('success'); message.textContent = t('Licence active. Unlimited records are unlocked.');
      updateAccessUI();
      showToast(t('Agency licence activated.'));
    } catch (error) {
      message.classList.add('error'); message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector('#deactivateLicence').addEventListener('click', async event => {
    if (!window.confirm(t('Deactivate this browser? Your records will stay here, but new records may require another activation.'))) return;
    event.target.disabled = true;
    try {
      await licenseApi.deactivate();
      updateAccessUI(); showToast(t('This browser has been deactivated.'));
    } catch (error) {
      showToast(error.message || t('This browser could not be deactivated.'));
    } finally {
      event.target.disabled = false;
    }
  });

  window.PublishProofRecords = {
    load: loadRecords,
    deletions: loadDeletions,
    markDeleted,
    replace(records) { saveRecords(records); renderRecords(); updateAccessUI(); }
  };
  window.PublishProofApp = { showView };
  updateDecision();
  renderRecords();
  updateAccessUI();
  licenseApi.validate().then(() => updateAccessUI());
  if (location.hash === '#activate') showView('license');
  if (location.hash === '#account' && !document.querySelector('#accountNav')?.hidden) showView('account');
})();
