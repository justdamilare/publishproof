(() => {
  'use strict';

  const STORAGE_KEY = 'publishproof.language.v1';
  const originals = new WeakMap();
  const translations = {
    de: {
      'How it works': 'So funktioniert es', 'Workspace': 'Arbeitsbereich', 'Agency checklist': 'Agentur-Checkliste', 'Pricing': 'Preise', 'Open workspace': 'Arbeitsbereich öffnen',
      'Local-first evidence for AI-assisted campaigns': 'Lokale Nachweise für KI-gestützte Kampagnen', 'Proof before': 'Nachweis vor dem', 'publish.': 'Veröffentlichen.',
      'Record what AI changed, who reviewed it, and why you chose to label it—then hand your client a clean evidence pack.': 'Erfassen Sie, was die KI verändert hat, wer geprüft hat und warum Sie eine Kennzeichnung gewählt haben – und geben Sie Ihrem Kunden einen klaren Nachweisbericht.',
      'Create a publication record': 'Veröffentlichungsnachweis erstellen', 'See the workflow': 'Ablauf ansehen', 'No account': 'Kein Konto', 'No uploads': 'Keine Uploads', 'Works in your browser': 'Läuft im Browser',
      'Capture the facts': 'Fakten erfassen', 'Check the disclosure path': 'Kennzeichnung prüfen', 'Export client-ready proof': 'Kundenfertigen Nachweis exportieren',
      'The missing layer': 'Die fehlende Ebene', 'Your tools make the asset.': 'Ihre Tools erstellen das Asset.', 'Your team still owns the decision.': 'Ihr Team verantwortet weiterhin die Entscheidung.',
      'PublishProof creates a lightweight record between generation and publication: the AI contribution, source file fingerprint, human review, disclosure reasoning, and final approval.': 'PublishProof erstellt einen schlanken Nachweis zwischen Erstellung und Veröffentlichung: KI-Beitrag, Dateifingerabdruck, menschliche Prüfung, Kennzeichnungsbegründung und finale Freigabe.',
      'Capture': 'Erfassen', 'Check': 'Prüfen', 'Approve': 'Freigeben', 'Prove': 'Nachweisen',
      'Private workspace': 'Privater Arbeitsbereich', 'Campaign evidence,': 'Kampagnennachweise,', 'kept close.': 'nah bei Ihnen.', 'Local by default': 'Standardmäßig lokal',
      'Records and file fingerprints stay in this browser. Files are hashed on your device and are never uploaded.': 'Nachweise und Dateifingerabdrücke bleiben in diesem Browser. Dateien werden auf Ihrem Gerät gehasht und nie hochgeladen.',
      'Records': 'Nachweise', 'New record': 'Neuer Nachweis', 'Backup JSON': 'JSON-Sicherung', 'Export CSV': 'CSV exportieren', 'Device storage': 'Gerätespeicher', 'Nothing sent to a server': 'Nichts wird an einen Server gesendet',
      'Workspace / records': 'Arbeitsbereich / Nachweise', 'Publication records': 'Veröffentlichungsnachweise', 'Total records': 'Nachweise gesamt', 'Review complete': 'Prüfung abgeschlossen', 'Labels recorded': 'Kennzeichnungen erfasst', 'Load sample': 'Beispiel laden', 'No publication records yet.': 'Noch keine Veröffentlichungsnachweise.', 'Create your first record': 'Ersten Nachweis erstellen',
      'Workspace / new record': 'Arbeitsbereich / Neuer Nachweis', 'Document a publication': 'Veröffentlichung dokumentieren', 'Cancel': 'Abbrechen', '1 Campaign': '1 Kampagne', '2 AI contribution': '2 KI-Beitrag', '3 Review & disclosure': '3 Prüfung & Kennzeichnung',
      'Campaign facts': 'Kampagnenfakten', 'Identify the final asset and where it is expected to appear.': 'Bestimmen Sie das finale Asset und den vorgesehenen Veröffentlichungsort.', 'Client or brand': 'Kunde oder Marke', 'Campaign': 'Kampagne', 'Asset title': 'Asset-Titel', 'Channel': 'Kanal', 'Planned publication date': 'Geplantes Veröffentlichungsdatum', 'Public URL or placement': 'Öffentliche URL oder Platzierung', 'Final file for fingerprinting': 'Finale Datei für den Fingerabdruck',
      'Select a file': 'Datei auswählen', 'or drop it here. Only a SHA-256 fingerprint is retained.': 'oder hier ablegen. Es wird nur ein SHA-256-Fingerabdruck gespeichert.', 'AI contribution': 'KI-Beitrag', 'Describe what the AI system actually did. When uncertain, choose the more substantial option.': 'Beschreiben Sie, was das KI-System tatsächlich getan hat. Wählen Sie im Zweifel die umfangreichere Option.',
      'Content type': 'Inhaltstyp', 'AI system or vendor': 'KI-System oder Anbieter', 'Model / version, if known': 'Modell / Version, falls bekannt', 'Realistic resemblance': 'Realistische Ähnlichkeit', 'Could appear authentic or truthful': 'Könnte authentisch oder wahr wirken', 'Public-interest text': 'Text von öffentlichem Interesse',
      'Review & disclosure': 'Prüfung & Kennzeichnung', 'Record the actual control, not the intended control.': 'Erfassen Sie die tatsächlich vorhandene Kontrolle, nicht die beabsichtigte.', 'Human review completed': 'Menschliche Prüfung abgeschlossen', 'Editorial responsibility assigned': 'Redaktionelle Verantwortung zugewiesen', 'Provider marking retained': 'Anbieterkennzeichnung beibehalten', 'Visible or audible disclosure added': 'Sichtbare oder hörbare Kennzeichnung hinzugefügt', 'Reviewer': 'Prüfende Person', 'Review date': 'Prüfdatum', 'Working assessment': 'Vorläufige Einschätzung', 'Disclosure wording': 'Kennzeichnungstext', 'Placement or timing': 'Platzierung oder Zeitpunkt', 'Evidence link': 'Nachweislink', 'Internal owner': 'Interne Verantwortung', 'Notes and rationale': 'Notizen und Begründung', 'Save publication record': 'Veröffentlichungsnachweis speichern',
      'Source-linked, deliberately conservative': 'Quellenbasiert und bewusst vorsichtig', 'Built around the official guidance—not a fear-based compliance score.': 'Auf offiziellen Leitlinien aufgebaut – nicht auf einem angstmachenden Compliance-Score.',
      'Founding offer': 'Gründungsangebot', 'Start free.': 'Kostenlos starten.', 'Keep proof portable.': 'Nachweise portabel halten.', 'Founding agency': 'Gründungsagentur', 'one time': 'einmalig', 'Request founding access': 'Gründungszugang anfragen',
      'Try the preview free, then email us if you want the founding-agency licence.': 'Testen Sie die Vorschau kostenlos und schreiben Sie uns, wenn Sie die Gründungsagentur-Lizenz möchten.',
      'Proof before publish. Built for agencies that want a record, not another black box.': 'Nachweis vor dem Veröffentlichen. Für Agenturen, die einen Nachweis statt einer weiteren Black Box wollen.', 'Not legal advice': 'Keine Rechtsberatung',
      'EU AI Act Article 50:': 'EU-KI-Verordnung, Artikel 50:', 'an agency checklist.': 'eine Agentur-Checkliste.',
      'From 2 August 2026, Article 50 transparency obligations apply.': 'Die Transparenzpflichten nach Artikel 50 gelten ab dem 2. August 2026.'
    },
    fr: {
      'How it works': 'Fonctionnement', 'Workspace': 'Espace de travail', 'Agency checklist': 'Checklist agence', 'Pricing': 'Tarifs', 'Open workspace': 'Ouvrir l’espace',
      'Local-first evidence for AI-assisted campaigns': 'Preuves locales pour les campagnes assistées par IA', 'Proof before': 'La preuve avant de', 'publish.': 'publier.',
      'Record what AI changed, who reviewed it, and why you chose to label it—then hand your client a clean evidence pack.': 'Consignez ce que l’IA a modifié, qui a vérifié et pourquoi vous avez choisi d’étiqueter le contenu, puis remettez à votre client un dossier de preuves clair.',
      'Create a publication record': 'Créer un dossier de publication', 'See the workflow': 'Voir le processus', 'No account': 'Sans compte', 'No uploads': 'Sans téléversement', 'Works in your browser': 'Fonctionne dans votre navigateur',
      'Capture the facts': 'Consigner les faits', 'Check the disclosure path': 'Vérifier la divulgation', 'Export client-ready proof': 'Exporter une preuve client',
      'The missing layer': 'La couche manquante', 'Your tools make the asset.': 'Vos outils créent le contenu.', 'Your team still owns the decision.': 'Votre équipe reste responsable de la décision.',
      'PublishProof creates a lightweight record between generation and publication: the AI contribution, source file fingerprint, human review, disclosure reasoning, and final approval.': 'PublishProof crée un dossier léger entre la génération et la publication : contribution de l’IA, empreinte du fichier, contrôle humain, justification de la divulgation et validation finale.',
      'Capture': 'Consigner', 'Check': 'Vérifier', 'Approve': 'Approuver', 'Prove': 'Prouver',
      'Private workspace': 'Espace privé', 'Campaign evidence,': 'Les preuves de campagne,', 'kept close.': 'restent chez vous.', 'Local by default': 'Local par défaut',
      'Records and file fingerprints stay in this browser. Files are hashed on your device and are never uploaded.': 'Les dossiers et empreintes de fichiers restent dans ce navigateur. Les fichiers sont hachés sur votre appareil et ne sont jamais téléversés.',
      'Records': 'Dossiers', 'New record': 'Nouveau dossier', 'Backup JSON': 'Sauvegarde JSON', 'Export CSV': 'Exporter CSV', 'Device storage': 'Stockage de l’appareil', 'Nothing sent to a server': 'Aucune donnée envoyée à un serveur',
      'Workspace / records': 'Espace de travail / dossiers', 'Publication records': 'Dossiers de publication', 'Total records': 'Dossiers au total', 'Review complete': 'Contrôle terminé', 'Labels recorded': 'Étiquettes consignées', 'Load sample': 'Charger un exemple', 'No publication records yet.': 'Aucun dossier de publication pour le moment.', 'Create your first record': 'Créer votre premier dossier',
      'Workspace / new record': 'Espace de travail / nouveau dossier', 'Document a publication': 'Documenter une publication', 'Cancel': 'Annuler', '1 Campaign': '1 Campagne', '2 AI contribution': '2 Contribution IA', '3 Review & disclosure': '3 Contrôle et divulgation',
      'Campaign facts': 'Informations de campagne', 'Identify the final asset and where it is expected to appear.': 'Identifiez le contenu final et l’endroit où il doit apparaître.', 'Client or brand': 'Client ou marque', 'Campaign': 'Campagne', 'Asset title': 'Titre du contenu', 'Channel': 'Canal', 'Planned publication date': 'Date de publication prévue', 'Public URL or placement': 'URL publique ou emplacement', 'Final file for fingerprinting': 'Fichier final à empreinter',
      'Select a file': 'Sélectionner un fichier', 'or drop it here. Only a SHA-256 fingerprint is retained.': 'ou déposez-le ici. Seule une empreinte SHA-256 est conservée.', 'AI contribution': 'Contribution de l’IA', 'Describe what the AI system actually did. When uncertain, choose the more substantial option.': 'Décrivez ce que le système d’IA a réellement fait. En cas de doute, choisissez l’option la plus importante.',
      'Content type': 'Type de contenu', 'AI system or vendor': 'Système ou fournisseur d’IA', 'Model / version, if known': 'Modèle / version, si connu', 'Realistic resemblance': 'Ressemblance réaliste', 'Could appear authentic or truthful': 'Pourrait paraître authentique ou véridique', 'Public-interest text': 'Texte d’intérêt public',
      'Review & disclosure': 'Contrôle et divulgation', 'Record the actual control, not the intended control.': 'Consignez le contrôle réel, pas le contrôle prévu.', 'Human review completed': 'Contrôle humain terminé', 'Editorial responsibility assigned': 'Responsabilité éditoriale attribuée', 'Provider marking retained': 'Marquage du fournisseur conservé', 'Visible or audible disclosure added': 'Divulgation visible ou audible ajoutée', 'Reviewer': 'Personne chargée du contrôle', 'Review date': 'Date du contrôle', 'Working assessment': 'Évaluation provisoire', 'Disclosure wording': 'Texte de divulgation', 'Placement or timing': 'Emplacement ou moment', 'Evidence link': 'Lien de preuve', 'Internal owner': 'Responsable interne', 'Notes and rationale': 'Notes et justification', 'Save publication record': 'Enregistrer le dossier de publication',
      'Source-linked, deliberately conservative': 'Lié aux sources et volontairement prudent', 'Built around the official guidance—not a fear-based compliance score.': 'Conçu à partir des lignes directrices officielles, pas d’un score de conformité anxiogène.',
      'Founding offer': 'Offre de lancement', 'Start free.': 'Commencez gratuitement.', 'Keep proof portable.': 'Gardez vos preuves portables.', 'Founding agency': 'Agence fondatrice', 'one time': 'paiement unique', 'Request founding access': 'Demander l’accès fondateur',
      'Try the preview free, then email us if you want the founding-agency licence.': 'Essayez gratuitement la préversion, puis écrivez-nous si vous souhaitez la licence agence fondatrice.',
      'Proof before publish. Built for agencies that want a record, not another black box.': 'La preuve avant de publier. Pour les agences qui veulent un dossier, pas une nouvelle boîte noire.', 'Not legal advice': 'Pas un conseil juridique',
      'EU AI Act Article 50:': 'Article 50 de l’AI Act :', 'an agency checklist.': 'une checklist pour les agences.',
      'From 2 August 2026, Article 50 transparency obligations apply.': 'Les obligations de transparence de l’article 50 s’appliquent à partir du 2 août 2026.'
    }
  };

  function replaceText(language) {
    const dictionary = translations[language] || {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return parent && !['SCRIPT', 'STYLE'].includes(parent.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const current = node.nodeValue;
      const source = originals.get(node);
      const expected = source && dictionary[source.trim()];
      if (!source || (current.trim() !== source.trim() && current.trim() !== (expected || ''))) originals.set(node, current);
      const english = originals.get(node);
      const translated = dictionary[english.trim()];
      if (translated) node.nodeValue = english.replace(english.trim(), translated);
      else node.nodeValue = english;
    }
  }

  function translate(language) {
    const selected = translations[language] ? language : 'en';
    document.documentElement.lang = selected;
    document.querySelectorAll('.language-select').forEach(select => { select.value = selected; });
    replaceText(selected);
    localStorage.setItem(STORAGE_KEY, selected);
  }

  function init() {
    const initial = localStorage.getItem(STORAGE_KEY) || 'en';
    document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', event => translate(event.target.value)));
    translate(initial);
  }

  window.publishproofTranslate = () => translate(localStorage.getItem(STORAGE_KEY) || 'en');
  document.addEventListener('DOMContentLoaded', init);
})();

