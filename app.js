(() => {
  'use strict';

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

  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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
    recordsView.classList.toggle('active', !isNew);
    newView.classList.toggle('active', isNew);
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (isNew) setTimeout(() => form.elements.client.focus(), 50);
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
      return { status: 'pending', code: 'incomplete', title: 'Complete the AI contribution fields', text: 'PublishProof will show a conservative workflow recommendation here.' };
    }
    if (data.aiUse === 'none') {
      return { status: 'clear', code: 'no-ai', title: 'No AI-specific disclosure indicated', text: 'The record says no AI was used. Keep the record if it supports a client or internal assurance process.' };
    }
    if (data.contentType === 'interactive') {
      return { status: 'action', code: 'interactive-ai', title: 'First-interaction disclosure recommended', text: 'Interactive AI should clearly tell natural persons that they are interacting with an AI system, unless the artificial nature is genuinely obvious.' };
    }
    if (['image', 'video', 'audio', 'mixed'].includes(data.contentType) && ['generated', 'manipulated'].includes(data.aiUse) && data.realistic && data.couldMislead) {
      return { status: 'action', code: 'potential-deepfake', title: 'Visible disclosure recommended', text: 'The answers describe generated or manipulated realistic media that could appear authentic. Record a clear, perceivable disclosure at first exposure.' };
    }
    if (data.contentType === 'text' && ['generated', 'manipulated'].includes(data.aiUse) && data.publicInterest) {
      if (data.humanReviewed && data.editorialResponsibility) {
        return { status: 'clear', code: 'editorial-exception', title: 'Record the human-review exception', text: 'The answers indicate human review plus editorial responsibility. Preserve the reviewer, date, scope, and rationale supporting that conclusion.' };
      }
      return { status: 'action', code: 'public-interest-text', title: 'Visible disclosure recommended', text: 'AI-generated or manipulated public-interest text may require disclosure unless both human review/editorial control and editorial responsibility apply.' };
    }
    if (['generated', 'manipulated'].includes(data.aiUse)) {
      return { status: 'pending', code: 'document-and-review', title: 'Document the output and confirm scope', text: 'These answers do not trigger the narrow deployer paths above. Retain any provider marking, document human review, and confirm the context before publication.' };
    }
    return { status: 'clear', code: 'assistive', title: 'Document the assistive scope', text: 'Minor assistive editing may fall outside the relevant labelling paths when it does not substantially alter input data or meaning. Preserve what changed and who checked it.' };
  }

  function updateDecision() {
    const decision = assess(formState());
    decisionCard.className = `decision-card ${decision.status}`;
    decisionTitle.textContent = decision.title;
    decisionText.textContent = decision.text;
    if (form.elements.visibleLabel.checked && !form.elements.labelText.value) {
      const suggestions = {
        'interactive-ai': 'You are interacting with an AI system.',
        'potential-deepfake': 'This content was generated or manipulated using AI.',
        'public-interest-text': 'This text was generated or manipulated using AI.'
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
      const status = record.decision?.status === 'action' ? 'Action recorded' : record.humanReviewed ? 'Reviewed' : 'Needs review';
      const statusClass = record.decision?.status === 'action' && !record.visibleLabel ? 'action' : '';
      return `<article class="record-row">
        <div class="record-icon">${escapeHtml((record.contentType || 'R')[0].toUpperCase())}</div>
        <div><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.client)} · ${escapeHtml(record.campaign)}</small></div>
        <div><strong>${escapeHtml(record.channel || '—')}</strong><small>${escapeHtml(record.publicationDate || 'Date not set')}</small></div>
        <div><span class="status-pill ${statusClass}">${escapeHtml(status)}</span><small>${escapeHtml(record.decision?.title || 'Assessment pending')}</small></div>
        <div class="row-actions"><button class="icon-button" type="button" data-action="print" data-id="${escapeHtml(record.id)}" title="Print or save PDF">↗</button><button class="icon-button" type="button" data-action="delete" data-id="${escapeHtml(record.id)}" title="Delete record">×</button></div>
      </article>`;
    }).join('');
    if (records.length && !filtered.length) recordsList.innerHTML = '<div class="empty-state"><h4>No matching records.</h4><p>Try a different client, campaign, or channel.</p></div>';
  }

  function download(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function printRecord(record) {
    const windowRef = window.open('', '_blank');
    if (!windowRef) { showToast('Allow pop-ups to export the evidence pack.'); return; }
    const fields = [
      ['Client / brand', record.client], ['Campaign', record.campaign], ['Asset', record.title], ['Channel', record.channel],
      ['Publication date', record.publicationDate || 'Not set'], ['Content type', record.contentType], ['AI contribution', record.aiUse],
      ['AI system', [record.aiTool, record.aiVersion].filter(Boolean).join(' — ') || 'Not recorded'], ['Human review', record.humanReviewed ? `Completed by ${record.reviewer || 'unnamed reviewer'}${record.reviewDate ? ` on ${record.reviewDate}` : ''}` : 'Not recorded'],
      ['Editorial responsibility', record.editorialResponsibility ? 'Recorded' : 'Not recorded'], ['Provider marking retained', record.machineMark ? 'Yes' : 'Not recorded'],
      ['Visible / audible disclosure', record.visibleLabel ? 'Yes' : 'No'], ['Disclosure wording', record.labelText || 'Not recorded'], ['Placement / timing', record.labelPlacement || 'Not recorded'],
      ['File', record.fileName ? `${record.fileName} (${formatBytes(record.fileSize)})` : 'No file fingerprinted'], ['SHA-256', record.fileHash || 'Not recorded'], ['Record integrity hash', record.recordHash || 'Not available']
    ];
    const rows = fields.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
    windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(record.id)} — PublishProof evidence pack</title><style>body{font-family:Arial,sans-serif;color:#102018;margin:48px;line-height:1.45}header{border-bottom:3px solid #102018;padding-bottom:20px;margin-bottom:28px}h1{font-size:36px;margin:0}.brand{font-weight:800;color:#102018}.tag{display:inline-block;margin:12px 0;padding:6px 10px;border:1px solid #102018;border-radius:99px;background:#d9ff55;font-size:11px;font-weight:800}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:11px;border-bottom:1px solid #ccd2ce;text-align:left;vertical-align:top;font-size:12px}th{width:30%;text-transform:uppercase;letter-spacing:.06em;font-size:9px}.assessment{padding:20px;border:1px solid #102018;background:#f3f0e8}.notes{white-space:pre-wrap}footer{margin-top:36px;padding-top:18px;border-top:1px solid #102018;color:#647068;font-size:9px}@media print{body{margin:16mm}}</style></head><body><header><div class="brand">PublishProof / evidence record</div><h1>${escapeHtml(record.title)}</h1><div class="tag">${escapeHtml(record.decision?.title || 'Assessment pending')}</div></header><section class="assessment"><strong>Workflow assessment</strong><p>${escapeHtml(record.decision?.text || '')}</p></section><table>${rows}</table><h2>Notes and rationale</h2><p class="notes">${escapeHtml(record.notes || 'No notes recorded.')}</p><footer>Generated ${escapeHtml(new Date().toISOString())}. PublishProof is a workflow and recordkeeping aid, not legal advice. Source: European Commission guidelines on Article 50 transparency obligations, published 20 July 2026.</footer><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`);
    windowRef.document.close();
  }

  document.querySelectorAll('[data-scroll-workspace]').forEach(button => button.addEventListener('click', () => document.querySelector('#workspace').scrollIntoView({ behavior: 'smooth' })));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  ['#newRecordTop', '#emptyCreate'].forEach(selector => document.querySelector(selector).addEventListener('click', () => showView('new')));
  document.querySelector('#cancelRecord').addEventListener('click', () => showView('records'));
  searchInput.addEventListener('input', renderRecords);
  form.addEventListener('input', updateDecision);
  form.addEventListener('change', updateDecision);

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) { fileEvidence = null; fileLabel.innerHTML = '<b>Select a file</b> or drop it here. Only a SHA-256 fingerprint is retained.'; return; }
    fileLabel.textContent = `Fingerprinting ${file.name}…`;
    try {
      const hash = await fingerprint(file);
      fileEvidence = { fileName: file.name, fileSize: file.size, fileHash: hash };
      fileLabel.innerHTML = `<b>${escapeHtml(file.name)}</b> · ${escapeHtml(formatBytes(file.size))} · SHA-256 ${escapeHtml(hash.slice(0, 12))}…`;
    } catch {
      fileEvidence = null; fileLabel.textContent = 'Could not fingerprint this file. You can still save the record.';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = formState();
    const decision = assess(data);
    const record = { id: `PP-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), ...data, ...(fileEvidence || {}), decision };
    record.recordHash = await hashText(JSON.stringify(record));
    const records = loadRecords(); records.unshift(record); saveRecords(records);
    form.reset(); fileEvidence = null; fileLabel.innerHTML = '<b>Select a file</b> or drop it here. Only a SHA-256 fingerprint is retained.';
    updateDecision(); renderRecords(); showView('records'); showToast('Publication record saved on this device.');
  });

  recordsList.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const records = loadRecords(); const record = records.find(item => item.id === button.dataset.id);
    if (!record) return;
    if (button.dataset.action === 'print') printRecord(record);
    if (button.dataset.action === 'delete' && window.confirm(`Delete “${record.title}” from this device?`)) {
      saveRecords(records.filter(item => item.id !== record.id)); renderRecords(); showToast('Record deleted.');
    }
  });

  document.querySelector('#loadSample').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.some(record => record.id === sampleRecord.id)) { records.unshift(sampleRecord); saveRecords(records); renderRecords(); showToast('Sample record added.'); }
    else showToast('The sample is already in your workspace.');
  });

  document.querySelector('#exportJson').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) { showToast('Create a record before exporting.'); return; }
    download(`publishproof-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({ schema: 1, exportedAt: new Date().toISOString(), records }, null, 2), 'application/json');
  });

  document.querySelector('#exportCsv').addEventListener('click', () => {
    const records = loadRecords();
    if (!records.length) { showToast('Create a record before exporting.'); return; }
    const fields = ['id','createdAt','client','campaign','title','channel','publicationDate','contentType','aiUse','aiTool','humanReviewed','reviewer','visibleLabel','labelText','labelPlacement','fileName','fileHash','recordHash'];
    const csv = [fields.join(','), ...records.map(record => fields.map(field => csvCell(record[field])).join(','))].join('\n');
    download(`publishproof-records-${new Date().toISOString().slice(0,10)}.csv`, csv, 'text/csv;charset=utf-8');
  });

  updateDecision();
  renderRecords();
})();
