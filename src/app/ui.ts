
export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Lens</title>
    <style>
      :root {
        --bg: #f2efe8;
        --panel: rgba(255, 252, 245, 0.9);
        --line: rgba(89, 66, 44, 0.18);
        --text: #2e241c;
        --muted: #786556;
        --accent: #0f766e;
        --accent-soft: rgba(15, 118, 110, 0.12);
        --danger: #b45309;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        color: var(--text);
        background: linear-gradient(180deg, #f9f5ee 0%, var(--bg) 100%);
        min-height: 100vh;
      }
      .shell { max-width: 1440px; margin: 0 auto; padding: 16px; }
      .card { background: var(--panel); border: 1px solid var(--line); border-radius: 20px; }
      .topbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; margin-bottom: 12px; }
      .topbar-copy, .workspace-form { padding: 14px 16px; }
      .workspace-form { display: flex; gap: 10px; align-items: end; }
      .workspace-field { min-width: min(420px, 42vw); }
      .workspace-status-wrap { min-width: 220px; max-width: 280px; }
      h1, h2, h3 { margin: 0 0 10px; font-family: Georgia, serif; }
      h1 { font-size: 1.7rem; }
      p { margin: 0; line-height: 1.45; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.66rem; color: var(--muted); margin-bottom: 6px; }
      label { display: block; font-size: 0.8rem; color: var(--muted); margin-bottom: 6px; }
      input, select, button { font: inherit; }
      input, select { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: white; color: var(--text); }
      button { border: 0; border-radius: 999px; padding: 10px 14px; background: var(--accent); color: white; cursor: pointer; }
      button.secondary { background: var(--accent-soft); color: var(--accent); }
      button.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
      button:disabled { opacity: 0.6; cursor: wait; }
      .status { color: var(--muted); font-size: 0.86rem; }
      .banner { min-height: 18px; margin-top: 4px; color: var(--danger); font-size: 0.8rem; }
      .loading-status { min-height: 18px; margin-top: 6px; font-size: 0.8rem; color: var(--accent); opacity: 0; }
      .loading-status.active { opacity: 1; }
      .main { position: relative; display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 20px; align-items: start; }
      .sidebar, .detail { min-height: 0; display: flex; flex-direction: column; overflow: visible; }
      .sidebar { position: sticky; top: 16px; max-height: calc(100vh - 32px); }
      .sidebar-header, .detail-header, .filters { padding: 14px 16px; border-bottom: 1px solid var(--line); }
      .filters { display: grid; gap: 10px; }
      .filters.simple-mode { gap: 8px; }
      .segmented { display: inline-flex; gap: 6px; padding: 4px; border-radius: 999px; background: rgba(89, 66, 44, 0.06); border: 1px solid var(--line); width: fit-content; }
      .segmented button { padding: 8px 12px; }
      .segmented button.active { background: var(--accent); color: white; }
      .node-list { flex: 1; min-height: 0; overflow: auto; padding: 12px; }
      .detail-body { flex: 1; min-height: 0; overflow: visible; padding: 12px; }
      .detail-body { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-content: start; }
      .node-item, .file-button, .member-button { width: 100%; text-align: left; display: block; padding: 12px; margin-bottom: 8px; border-radius: 14px; border: 1px solid transparent; background: transparent; color: var(--text); }
      .node-item.active, .file-button.active, .member-button.active { background: var(--accent-soft); border-color: rgba(15, 118, 110, 0.24); }
      .node-meta, .file-meta { color: var(--muted); font-size: 0.82rem; margin-top: 6px; }
      .file-group { margin-bottom: 12px; padding: 10px; border-radius: 16px; background: rgba(255, 253, 248, 0.6); border: 1px solid rgba(89, 66, 44, 0.1); }
      .file-members { display: grid; gap: 8px; padding-top: 4px; }
      .member-button { background: rgba(242, 239, 232, 0.72); }
      .member-kind, .chip { display: inline-block; padding: 4px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-size: 0.76rem; }
      .simple-guide { padding: 10px 12px; border-radius: 14px; background: rgba(15, 118, 110, 0.08); color: var(--muted); font-size: 0.83rem; line-height: 1.4; }
      .simple-section { margin-bottom: 14px; }
      .simple-section-title { margin: 0 0 8px; font-size: 0.95rem; color: var(--text); }
      .simple-section-copy { margin: 0 0 10px; color: var(--muted); font-size: 0.8rem; line-height: 1.4; }
      .simple-rank { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
      .rank-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 8px; border-radius: 999px; background: rgba(15, 118, 110, 0.14); color: var(--accent); font-size: 0.78rem; font-weight: 600; }
      .signal-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .signal-chip { display: inline-block; padding: 4px 8px; border-radius: 999px; background: rgba(89, 66, 44, 0.08); color: var(--muted); font-size: 0.76rem; }
      .why-line { margin-top: 8px; color: var(--muted); font-size: 0.8rem; line-height: 1.4; }
      .note-callout { color: var(--muted); font-size: 0.9rem; line-height: 1.5; }
      .hidden { display: none !important; }
      .panel { background: rgba(255, 253, 248, 0.96); border: 1px solid var(--line); border-radius: 16px; padding: 14px; }
      .panel.wide { grid-column: 1 / -1; }
      .hero-panel { background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(255, 253, 248, 0.96)); }
      .fact-list { display: grid; gap: 8px; margin-top: 6px; }
      .fact-item { padding: 10px 12px; border-radius: 12px; background: rgba(242, 239, 232, 0.58); }
      .fact-label { display: block; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
      .plain-summary { font-size: 1rem; line-height: 1.6; }
      .chips, .list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .list { display: grid; }
      .list-item { padding: 10px 12px; background: rgba(242, 239, 232, 0.68); border-radius: 14px; }
      .simple-callout, .empty { color: var(--muted); }
      .loading-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(249, 245, 238, 0.74); opacity: 0; pointer-events: none; transition: opacity 180ms ease; }
      .loading-overlay.active { opacity: 1; pointer-events: auto; }
      .loading-card { min-width: 260px; max-width: 360px; padding: 18px 20px; border-radius: 18px; background: rgba(255, 253, 248, 0.96); border: 1px solid var(--line); text-align: center; }
      .spinner { width: 42px; height: 42px; margin: 0 auto 12px; border-radius: 999px; border: 4px solid rgba(15, 118, 110, 0.16); border-top-color: var(--accent); animation: spin 780ms linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 1080px) {
        .topbar, .main, .detail-body { grid-template-columns: 1fr; }
        .workspace-form { flex-direction: column; align-items: stretch; }
        .workspace-field, .workspace-status-wrap { min-width: 0; max-width: none; }
        .main { min-height: auto; }
        .sidebar { position: static; max-height: none; }
        .sidebar, .detail { height: auto; overflow: visible; }
        .node-list, .detail-body { overflow: visible; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="topbar">
        <div class="card topbar-copy">
          <p class="eyebrow">Local code walkthrough</p>
          <h1>Code Lens</h1>
          <p>Point this at a folder and walk through the code in plain language, or switch to Graph View when you want more technical detail.</p>
        </div>
        <form id="workspace-form" class="card workspace-form">
          <div class="workspace-field">
            <label for="folder-path">Folder</label>
            <input id="folder-path" name="folderPath" placeholder="C:\\\\Users\\\\carll\\\\your-repo" required />
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button id="choose-folder-button" class="secondary" type="button">Choose Folder</button>
            <button id="open-button" type="button">Open Workspace</button>
            <button id="reindex-button" class="secondary" type="button" disabled>Reindex</button>
          </div>
          <div class="workspace-status-wrap">
            <p id="workspace-status" class="status">No workspace loaded yet.</p>
            <div id="banner" class="banner"></div>
            <div id="loading-status" class="loading-status"></div>
          </div>
        </form>
      </section>
      <section class="main">
        <div id="loading-overlay" class="loading-overlay" aria-live="polite" aria-busy="false">
          <div class="loading-card">
            <div class="spinner"></div>
            <div id="loading-title"><strong>Working...</strong></div>
            <div id="loading-copy" class="status">Loading the workspace.</div>
          </div>
        </div>
        <aside class="card sidebar">
          <div class="sidebar-header">
            <h2 id="sidebar-title">Walkthrough</h2>
            <p class="status" id="symbol-summary">Open a workspace to load symbols.</p>
          </div>
          <div class="filters">
            <div class="segmented">
              <button id="simple-view-button" type="button" class="active">Simple View</button>
              <button id="graph-view-button" type="button" class="ghost">Graph View</button>
            </div>
            <div id="simple-guide" class="simple-guide">Simple View is a reading guide. It tries to separate real starting points from big local files and smaller supporting pieces.</div>
            <input id="search-input" placeholder="Search by name or file" disabled />
            <select id="kind-filter" disabled class="hidden">
              <option value="">Everything</option>
              <option value="component">Components</option>
              <option value="function">Functions</option>
              <option value="hook">Hooks</option>
              <option value="class">Classes</option>
              <option value="method">Methods</option>
              <option value="type">Types</option>
              <option value="route">Routes</option>
              <option value="store">Stores</option>
              <option value="test">Tests</option>
            </select>
          </div>
          <div id="node-list" class="node-list"></div>
        </aside>
        <section class="card detail">
          <div class="detail-header">
            <h2 id="detail-title">Workspace detail</h2>
            <p id="detail-subtitle" class="status">Select a file member to see a simple explanation.</p>
          </div>
          <div id="detail-body" class="detail-body">
            <div class="panel wide empty">No symbol selected yet.</div>
          </div>
        </section>
      </section>
    </div>
    <script>
      const state = { workspacePath: '', nodes: [], activeNodeId: '', focus: null, viewMode: 'simple', expandedFiles: {}, lastOutwardTrace: [], lastInwardTrace: [] };
      const els = {
        form: document.getElementById('workspace-form'), folderPath: document.getElementById('folder-path'), chooseFolderButton: document.getElementById('choose-folder-button'),
        openButton: document.getElementById('open-button'), reindexButton: document.getElementById('reindex-button'), workspaceStatus: document.getElementById('workspace-status'),
        loadingStatus: document.getElementById('loading-status'), sidebarTitle: document.getElementById('sidebar-title'), symbolSummary: document.getElementById('symbol-summary'),
        searchInput: document.getElementById('search-input'), kindFilter: document.getElementById('kind-filter'), nodeList: document.getElementById('node-list'),
        simpleGuide: document.getElementById('simple-guide'),
        detailTitle: document.getElementById('detail-title'), detailSubtitle: document.getElementById('detail-subtitle'), detailBody: document.getElementById('detail-body'),
        banner: document.getElementById('banner'), loadingOverlay: document.getElementById('loading-overlay'), loadingTitle: document.getElementById('loading-title'),
        loadingCopy: document.getElementById('loading-copy'), simpleViewButton: document.getElementById('simple-view-button'), graphViewButton: document.getElementById('graph-view-button')
      };
      function setBanner(message = '') { els.banner.textContent = message; }
      function setLoading(active, title = 'Working...', copy = 'Loading the workspace.') {
        els.loadingOverlay.classList.toggle('active', active);
        els.loadingOverlay.setAttribute('aria-busy', active ? 'true' : 'false');
        els.loadingTitle.textContent = title;
        els.loadingCopy.textContent = copy;
        els.loadingStatus.textContent = active ? title : '';
        els.loadingStatus.classList.toggle('active', active);
      }
      function setWorkspaceControls(enabled) {
        els.reindexButton.disabled = !enabled; els.searchInput.disabled = !enabled; els.kindFilter.disabled = !enabled;
      }
      function setViewMode(mode) {
        state.viewMode = mode;
        const simpleMode = mode === 'simple';
        els.simpleViewButton.classList.toggle('active', mode === 'simple'); els.graphViewButton.classList.toggle('active', mode === 'graph');
        els.simpleViewButton.classList.toggle('ghost', mode !== 'simple'); els.graphViewButton.classList.toggle('ghost', mode !== 'graph');
        els.sidebarTitle.textContent = mode === 'simple' ? 'Walkthrough' : 'Symbols';
        els.kindFilter.classList.toggle('hidden', simpleMode);
        els.simpleGuide.classList.toggle('hidden', !simpleMode);
        els.searchInput.placeholder = simpleMode ? 'Search by name or file' : 'Search function, class, file, or symbol';
        document.querySelector('.filters').classList.toggle('simple-mode', simpleMode);
        renderNodes(); if (state.focus) renderDetail(state.focus, state.lastOutwardTrace || [], state.lastInwardTrace || []);
      }
      async function request(url, options = {}) {
        const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Request failed');
        return payload;
      }
      let backgroundSyncPromise = null;
      async function openWorkspace(folderPath, reindex = false) {
        setBanner(''); setLoading(true, reindex ? 'Indexing workspace...' : 'Opening workspace...', reindex ? 'Scanning files and building the symbol graph.' : 'Preparing the workspace view.');
        els.chooseFolderButton.disabled = true; els.openButton.disabled = true; els.workspaceStatus.textContent = 'Opening workspace...';
        try {
          const { workspace } = await request('/api/workspaces/open', { method: 'POST', body: JSON.stringify({ folderPath, reindex }) });
          state.workspacePath = workspace.folderPath; els.folderPath.value = workspace.folderPath;
          els.workspaceStatus.textContent = workspace.nodeCount
            ? 'Loaded cached index with ' + workspace.nodeCount + ' symbols from ' + workspace.folderPath
            : 'Workspace ready: ' + workspace.folderPath;
          setWorkspaceControls(true); await loadNodes();
          if (!reindex) { void syncWorkspaceInBackground(); }
        } catch (error) { setBanner(error.message); els.workspaceStatus.textContent = 'Unable to open workspace.'; }
        finally { setLoading(false); els.chooseFolderButton.disabled = false; els.openButton.disabled = false; }
      }
      async function syncWorkspaceInBackground() {
        if (!state.workspacePath || backgroundSyncPromise) return backgroundSyncPromise;
        els.workspaceStatus.textContent = state.nodes.length
          ? 'Loaded cached index. Checking for changed files in the background...'
          : 'Indexing workspace...';
        backgroundSyncPromise = request('/api/workspaces/reindex', { method: 'POST', body: JSON.stringify({ folderPath: state.workspacePath }) })
          .then(async ({ workspace }) => {
            els.workspaceStatus.textContent = 'Indexed ' + workspace.nodeCount + ' symbols from ' + workspace.folderPath;
            await loadNodes();
          })
          .catch((error) => {
            setBanner(error.message);
            els.workspaceStatus.textContent = 'Background sync failed for ' + state.workspacePath;
          })
          .finally(() => {
            backgroundSyncPromise = null;
          });
        return backgroundSyncPromise;
      }
      async function chooseFolder() {
        setBanner(''); setLoading(true, 'Waiting for folder selection...', 'Choose a local folder in the picker window.'); els.chooseFolderButton.disabled = true;
        try {
          let folderPath;
          let lastError = null;

          if (window.codeLensDesktop && typeof window.codeLensDesktop.chooseFolder === 'function') {
            try {
              folderPath = await window.codeLensDesktop.chooseFolder();
            } catch (error) {
              lastError = error;
            }
          }

          if (!folderPath) {
            try {
              const payload = await request('/api/system/pick-folder', { method: 'POST', body: JSON.stringify({}) });
              folderPath = payload.folderPath;
            } catch (error) {
              lastError = error;
            }
          }

          if (!folderPath && lastError) {
            throw lastError;
          }

          if (!folderPath) { setLoading(false); return; }
          els.folderPath.value = folderPath; await openWorkspace(folderPath, false);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Folder picker failed.';
          setBanner(message);
        }
        finally { setLoading(false); els.chooseFolderButton.disabled = false; }
      }
      async function reindexWorkspace() {
        if (!state.workspacePath) return;
        els.reindexButton.disabled = true; els.workspaceStatus.textContent = 'Indexing workspace...'; setBanner('');
        setLoading(true, 'Reindexing workspace...', 'Refreshing symbols and relationships for the current folder.');
        try {
          const { workspace } = await request('/api/workspaces/reindex', { method: 'POST', body: JSON.stringify({ folderPath: state.workspacePath }) });
          els.workspaceStatus.textContent = 'Indexed ' + workspace.nodeCount + ' symbols from ' + workspace.folderPath; await loadNodes();
        } catch (error) { setBanner(error.message); }
        finally { setLoading(false); els.reindexButton.disabled = false; }
      }
      async function loadNodes() {
        if (!state.workspacePath) return;
        setLoading(true, 'Loading symbols...', 'Refreshing the symbol list for this workspace.');
        try {
          const query = new URLSearchParams({ folderPath: state.workspacePath, query: els.searchInput.value, kind: els.kindFilter.value });
          const { nodes } = await request('/api/nodes?' + query.toString());
          state.nodes = nodes.filter((node) => node.kind !== 'file');
          if (!state.nodes.length) { state.activeNodeId = ''; renderNodes(); renderEmptyDetail('No symbols matched this filter.'); return; }
          if (!state.activeNodeId || !state.nodes.some((node) => node.id === state.activeNodeId)) state.activeNodeId = state.nodes[0].id;
          expandFileForActiveNode(); renderNodes(); await loadFocus(state.activeNodeId);
        } finally { setLoading(false); }
      }
      async function loadFocus(nodeId) {
        if (!state.workspacePath || !nodeId) return;
        setLoading(true, 'Loading symbol detail...', 'Tracing relationships, tests, and boundaries for the selected symbol.');
        try {
          const query = new URLSearchParams({ folderPath: state.workspacePath });
          const { focus, outwardTrace, inwardTrace } = await request('/api/focus/' + encodeURIComponent(nodeId) + '?' + query.toString());
          state.activeNodeId = nodeId; state.focus = focus; state.lastOutwardTrace = outwardTrace; state.lastInwardTrace = inwardTrace;
          expandFileForActiveNode(); renderNodes(); renderDetail(focus, outwardTrace, inwardTrace);
        } finally { setLoading(false); }
      }
      function renderNodes() {
        els.symbolSummary.textContent = state.nodes.length
          ? state.viewMode === 'simple'
            ? 'A reading guide for the codebase'
            : state.nodes.length + ' symbols loaded'
          : 'No symbols loaded';
        if (state.viewMode === 'simple') { renderSimpleExplorer(); return; }
        els.nodeList.innerHTML = state.nodes.map((node) => {
          const active = node.id === state.activeNodeId ? 'active' : '';
          return '<button class="node-item ' + active + '" data-node-id="' + escapeHtml(node.id) + '">'
            + '<strong>' + escapeHtml(node.name) + '</strong>'
            + '<div class="node-meta">' + escapeHtml(kindLabel(node.kind)) + ' - ' + escapeHtml(shortPath(node.filePath)) + ':' + node.spanStartLine + '</div>'
            + '</button>';
        }).join('');
      }
      function renderSimpleExplorer() {
        const ranked = [...state.nodes].sort((a, b) =>
          (b.centralityScore || 0) - (a.centralityScore || 0)
          || (b.incomingCount || 0) - (a.incomingCount || 0)
          || (b.outgoingCount || 0) - (a.outgoingCount || 0)
          || a.name.localeCompare(b.name)
        );
        const sections = bucketSimpleNodes(ranked);
        els.nodeList.innerHTML = sections.length ? sections.map((section) => {
          return '<section class="simple-section">'
            + '<h3 class="simple-section-title">' + escapeHtml(section.title) + '</h3>'
            + '<p class="simple-section-copy">' + escapeHtml(section.copy) + '</p>'
            + section.nodes.map((node, index) => {
              const active = node.id === state.activeNodeId ? 'active' : '';
              return '<button class="member-button ' + active + '" data-node-id="' + escapeHtml(node.id) + '">'
                + '<div class="simple-rank"><span class="rank-badge">#' + (index + 1) + '</span><span class="member-kind">' + escapeHtml(node.complexityLabel || 'Code') + '</span></div>'
                + '<strong>' + escapeHtml(node.name) + '</strong>'
                + '<div class="node-meta">' + escapeHtml(kindLabel(node.kind)) + ' in ' + escapeHtml(shortPath(node.filePath)) + '</div>'
                + '<div class="signal-row">'
                + '<span class="signal-chip">used by ' + (node.incomingCount || 0) + '</span>'
                + '<span class="signal-chip">touches ' + (node.outgoingCount || 0) + '</span>'
                + '</div>'
                + '<div class="why-line">' + escapeHtml(describeBucketReason(node)) + '</div>'
                + '</button>';
            }).join('')
            + '</section>';
        }).join('') : '<div class="panel empty">No symbols matched this search.</div>';
      }
      function renderEmptyDetail(message) {
        els.detailTitle.textContent = 'Workspace detail';
        els.detailSubtitle.textContent = 'Select a file member to see a simple explanation.';
        els.detailBody.innerHTML = '<div class="panel wide empty">' + escapeHtml(message) + '</div>';
      }
      function renderDetail(focus, outwardTrace, inwardTrace) {
        if (state.viewMode === 'simple') { renderSimpleDetail(focus, outwardTrace, inwardTrace); return; }
        els.detailTitle.textContent = focus.node.name;
        els.detailSubtitle.textContent = focus.node.filePath + ':' + focus.node.spanStartLine + '-' + focus.node.spanEndLine;
        const sectionList = (items, renderItem, empty) => items.length ? '<div class="list">' + items.map(renderItem).join('') + '</div>' : '<p class="empty">' + empty + '</p>';
        const renderEdge = (edge) => '<div class="list-item"><strong>' + escapeHtml(edge.edgeType) + '</strong> -> ' + escapeHtml(edge.toNodeId || edge.fromNodeId) + '<div class="node-meta">' + escapeHtml(edge.detail || edge.evidence) + '</div></div>';
        const renderNode = (node) => '<div class="list-item"><strong>' + escapeHtml(node.name) + '</strong><div class="node-meta">' + escapeHtml(node.kind) + ' - ' + escapeHtml(node.filePath) + '</div></div>';
        els.detailBody.innerHTML = [
          '<div class="panel"><h3>Identity</h3><p><strong>' + escapeHtml(focus.node.kind) + '</strong> - ' + escapeHtml(focus.node.responsibility) + '</p><p class="node-meta" style="margin-top:8px;">' + escapeHtml(focus.node.id) + '</p></div>',
          '<div class="panel"><h3>Explanation</h3><p>' + escapeHtml(focus.explanation ? focus.explanation.summary : 'No explanation available.') + '</p></div>',
          '<div class="panel"><h3>Boundaries</h3>' + (focus.boundaryFlags.length ? '<div class="chips">' + focus.boundaryFlags.map((flag) => '<span class="chip">' + escapeHtml(flag) + '</span>').join('') + '</div>' : '<p class="empty">No boundary flags detected.</p>') + '<h3 style="margin-top:16px;">Risk Flags</h3>' + (focus.riskFlags.length ? '<div class="chips">' + focus.riskFlags.map((flag) => '<span class="chip">' + escapeHtml(flag) + '</span>').join('') + '</div>' : '<p class="empty">No risk flags yet.</p>') + '</div>',
          '<div class="panel"><h3>Related Tests</h3>' + sectionList(focus.relatedTests, renderNode, 'No related tests found.') + '</div>',
          '<div class="panel"><h3>Incoming Edges</h3>' + sectionList(focus.incoming, renderEdge, 'No incoming edges.') + '</div>',
          '<div class="panel"><h3>Outgoing Edges</h3>' + sectionList(focus.outgoing, renderEdge, 'No outgoing edges.') + '</div>',
          '<div class="panel wide"><h3>Outward Trace</h3>' + sectionList(outwardTrace, renderEdge, 'No outward trace.') + '</div>',
          '<div class="panel wide"><h3>Inward Trace</h3>' + sectionList(inwardTrace, renderEdge, 'No inward trace.') + '</div>'
        ].join('');
      }
      function renderSimpleDetail(focus, outwardTrace, inwardTrace) {
        els.detailTitle.textContent = focus.node.name;
        els.detailSubtitle.textContent = friendlyNodeLabel(focus) + ' in ' + shortPath(focus.node.filePath) + ' at line ' + focus.node.spanStartLine;
        const outgoingNames = uniqueNames(focus.outgoing.map((edge) => readableTarget(edge.toNodeId))).slice(0, 6);
        const renderedNames = uniqueNames(focus.outgoing.filter((edge) => edge.edgeType === 'renders').map((edge) => readableTarget(edge.toNodeId))).slice(0, 6);
        const incomingNames = uniqueNames(focus.incoming.map((edge) => readableTarget(edge.fromNodeId))).slice(0, 6);
        const outwardNames = uniqueNames((outwardTrace || []).map((edge) => readableTarget(edge.toNodeId))).slice(0, 8);
        const inwardNames = uniqueNames((inwardTrace || []).map((edge) => readableTarget(edge.fromNodeId))).slice(0, 8);
        const tests = focus.relatedTests.slice(0, 6);
        const boundaries = focus.boundaryFlags.map(humanizeBoundary);
        const risks = focus.riskFlags.map(humanizeRisk);
        els.detailBody.innerHTML = [
          '<div class="panel wide hero-panel"><h3>What This Is</h3><p class="plain-summary">' + escapeHtml(buildPlainSummary(focus, outwardTrace, inwardTrace)) + '</p><p class="simple-callout">' + escapeHtml(buildSoftCallout(focus, renderedNames, incomingNames, outwardTrace, inwardTrace)) + '</p></div>',
          '<div class="panel"><h3>What It Seems To Do</h3><p>' + escapeHtml(buildPurposeSentence(focus, renderedNames, outgoingNames, incomingNames, outwardTrace, inwardTrace)) + '</p></div>',
          '<div class="panel"><h3>Where It Lives</h3><p>' + escapeHtml(shortPath(focus.node.filePath)) + '</p><p class="simple-callout">Lines ' + focus.node.spanStartLine + ' to ' + focus.node.spanEndLine + '.</p></div>',
          '<div class="panel"><h3>Quick Facts</h3>' + renderFacts(focus, renderedNames, incomingNames, outwardTrace, inwardTrace) + '</div>',
          '<div class="panel"><h3>What It Touches</h3>' + renderSimpleList(outgoingNames, 'Nothing important is linked from this symbol yet.') + '</div>',
          '<div class="panel"><h3>What Depends On It</h3>' + renderSimpleList(incomingNames, 'Nothing else in the tracked graph points back to it yet.') + '</div>',
          '<div class="panel"><h3>Where The Flow Goes</h3>' + renderSimpleList(outwardNames, 'The wider trace does not reach much beyond this symbol yet.') + '</div>',
          '<div class="panel"><h3>Where The Flow Starts</h3>' + renderSimpleList(inwardNames, 'Nothing in the wider trace leads into this symbol yet.') + '</div>',
          '<div class="panel"><h3>Things To Notice</h3>' + renderSimpleChips(boundaries, 'No major boundary crossings detected.') + '<div style="margin-top:14px;"><strong>Risk level</strong></div>' + renderSimpleChips(risks, 'No obvious risk signals.') + '</div>',
          '<div class="panel"><h3>Related Tests</h3>' + (tests.length ? '<div class="list">' + tests.map((test) => '<div class="list-item"><strong>' + escapeHtml(test.name) + '</strong><div class="node-meta">' + escapeHtml(shortPath(test.filePath)) + '</div></div>').join('') + '</div>' : '<p class="empty">No linked tests were found yet.</p>') + '</div>',
          '<div class="panel wide"><h3>Why It Showed Up</h3><p>' + escapeHtml(explainWhyThisRanked(focus, renderedNames, incomingNames, outwardTrace, inwardTrace)) + '</p></div>'
        ].join('');
      }
      function renderFacts(focus, renderedNames, incomingNames, outwardTrace, inwardTrace) {
        const facts = [];
        facts.push({ label: 'Kind', value: friendlyNodeLabel(focus) });
        facts.push({ label: 'Role', value: inferRoleLabel(focus, outwardTrace, inwardTrace) });
        if (renderedNames.length) {
          facts.push({ label: 'Pulls In', value: joinNatural(renderedNames.slice(0, 4)) });
        }
        if (incomingNames.length) {
          facts.push({ label: 'Used By', value: joinNatural(incomingNames.slice(0, 4)) });
        } else {
          facts.push({ label: 'Used By', value: 'No tracked callers yet' });
        }
        facts.push({ label: 'Size', value: describeSize(focus) });
        return '<div class="fact-list">' + facts.map((fact) =>
          '<div class="fact-item"><span class="fact-label">' + escapeHtml(fact.label) + '</span>' + escapeHtml(fact.value) + '</div>'
        ).join('') + '</div>';
      }
      function renderSimpleList(items, emptyText) {
        return items.length ? '<div class="list">' + items.map((item) => '<div class="list-item">' + escapeHtml(item) + '</div>').join('') + '</div>' : '<p class="empty">' + escapeHtml(emptyText) + '</p>';
      }
      function renderSimpleChips(items, emptyText) {
        return items.length ? '<div class="chips">' + items.map((item) => '<span class="chip">' + escapeHtml(item) + '</span>').join('') + '</div>' : '<p class="empty">' + escapeHtml(emptyText) + '</p>';
      }
      function buildPlainSummary(focus, outwardTrace, inwardTrace) {
        const relPath = shortPath(focus.node.filePath);
        const renderedNames = uniqueNames(focus.outgoing.filter((edge) => edge.edgeType === 'renders').map((edge) => readableTarget(edge.toNodeId))).slice(0, 4);
        const role = inferRoleLabel(focus, outwardTrace, inwardTrace).toLowerCase();
        if (focus.node.kind === 'constant') {
          return focus.node.name + ' is ' + describeConstant(focus) + ' in ' + relPath + '.';
        }
        if (focus.node.kind === 'component') {
          return describeComponentSummary(focus, relPath, renderedNames, role);
        }
        if (focus.node.kind === 'hook') {
          return focus.node.name + ' is a React hook in ' + relPath + '.';
        }
        if (focus.node.kind === 'function') {
          return describeFunctionSummary(focus, relPath, renderedNames, role);
        }
        if (focus.node.kind === 'class') {
          return focus.node.name + ' is a class in ' + relPath + '.';
        }
        if (focus.node.kind === 'type') {
          return focus.node.name + ' defines a type used in ' + relPath + '.';
        }
        return focus.node.name + ' is ' + describeNodeKind(focus.node.kind) + ' in ' + relPath + '.';
      }
      function buildPurposeSentence(focus, renderedNames, outgoingNames, incomingNames, outwardTrace, inwardTrace) {
        const outgoingCount = focus.outgoing.length; const incomingCount = focus.incoming.length;
        const outwardNames = uniqueNames((outwardTrace || []).map((edge) => readableTarget(edge.toNodeId))).slice(0, 5);
        const inwardNames = uniqueNames((inwardTrace || []).map((edge) => readableTarget(edge.fromNodeId))).slice(0, 5);
        if (focus.node.kind === 'component') {
          if (renderedNames.length) {
            return 'It brings together ' + joinNatural(renderedNames.slice(0, 4)) + '.';
          }
          if (outgoingCount >= 4) {
            return 'It seems to gather several smaller UI pieces in one place.';
          }
          return 'It seems to be a fairly focused UI component.';
        }
        if (focus.node.kind === 'function') {
          if (renderedNames.length) {
            return 'It acts more like a screen or panel than a small helper, and it brings together ' + joinNatural(renderedNames.slice(0, 4)) + '.';
          }
          if (focus.node.name === 'App') {
            return 'It looks like the main entry point that wires the app shell together.';
          }
          if (inwardNames.length && outwardNames.length) {
            return 'It seems to sit in the middle of a flow from ' + joinNatural(inwardNames.slice(0, 2)) + ' toward ' + joinNatural(outwardNames.slice(0, 3)) + '.';
          }
          if (outgoingNames.length >= 3) {
            return 'It seems to tie together ' + joinNatural(outgoingNames.slice(0, 4)) + '.';
          }
          return 'It looks like a smaller helper with a pretty local job.';
        }
        if (focus.node.kind === 'constant') {
          return 'It looks more like a shared reference value than a moving part of the app.';
        }
        if (incomingCount > 0) {
          return 'Several other parts of the codebase lean on it.';
        }
        return 'It seems fairly self-contained.';
      }
      function simplifySentence(text, fallback) {
        const cleaned = String(text || '').replace(/static facts?|structural inference|compiler extraction/gi, '').replace(/\\s+/g, ' ').trim();
        return cleaned || fallback;
      }
      function primarySummarySentence(text) {
        return String(text || '').split(/\\r?\\n/)[0].replace(/\\s*Trust note:.*$/i, '').trim();
      }
      function bucketSimpleNodes(nodes) {
        const startHere = [];
        const bigLocalPieces = [];
        const supportingPieces = [];

        for (const node of nodes) {
          const incoming = Number(node.incomingCount) || 0;
          const outgoing = Number(node.outgoingCount) || 0;
          const centrality = Number(node.centralityScore) || 0;
          const isInfrastructureKind = ['store', 'route', 'class', 'component', 'hook'].includes(node.kind);
          const isReference = node.kind === 'constant';

          if (incoming >= 3 || (incoming >= 1 && isInfrastructureKind && centrality >= 12)) {
            startHere.push(node);
            continue;
          }

          if (!isReference && (outgoing >= 6 || centrality >= 10 || (isInfrastructureKind && outgoing >= 3))) {
            bigLocalPieces.push(node);
            continue;
          }

          supportingPieces.push(node);
        }

        return [
          { title: 'Start Here', copy: 'These are the parts that other symbols already lean on, so they are usually better anchors for understanding the app.', nodes: startHere.slice(0, 12) },
          { title: 'Big Local Pieces', copy: 'These are bigger screens, panels, or coordinator functions. They may not be reused much, but they hold a lot of nearby behavior.', nodes: bigLocalPieces.slice(0, 16) },
          { title: 'Supporting Pieces', copy: 'These are smaller helpers, constants, and local pieces that usually make more sense once the larger flow is clear.', nodes: supportingPieces.slice(0, 16) }
        ].filter((section) => section.nodes.length);
      }
      function describeComponentSummary(focus, relPath, renderedNames, role) {
        const outgoingCount = focus.outgoing.length;
        if (focus.node.name === 'App') {
          return 'App is the top-level component in ' + relPath + '.';
        }
        if (renderedNames.length >= 3) {
          return focus.node.name + ' is a ' + role + ' in ' + relPath + ' that brings together ' + joinNatural(renderedNames.slice(0, 4)) + '.';
        }
        if (outgoingCount >= 12) {
          return focus.node.name + ' is a large UI component in ' + relPath + '.';
        }
        if (outgoingCount >= 4) {
          return focus.node.name + ' is a UI component in ' + relPath + ' that brings several smaller pieces together.';
        }
        return focus.node.name + ' is a UI component in ' + relPath + '.';
      }
      function describeFunctionSummary(focus, relPath, renderedNames, role) {
        const outgoingCount = focus.outgoing.length;
        if (focus.node.name === 'App') {
          return 'App is likely the top-level entry point in ' + relPath + '.';
        }
        if (renderedNames.length >= 3) {
          return focus.node.name + ' reads more like a ' + role + ' in ' + relPath + ', and it brings together ' + joinNatural(renderedNames.slice(0, 4)) + '.';
        }
        if (outgoingCount >= 8) {
          return focus.node.name + ' is a ' + role + ' in ' + relPath + '.';
        }
        if (outgoingCount >= 3) {
          return focus.node.name + ' is a function in ' + relPath + ' that ties a few related pieces together.';
        }
        return focus.node.name + ' is a helper function in ' + relPath + '.';
      }
      function describeConstant(focus) {
        const name = String(focus.node.name || '');
        const signature = String(focus.node.signature || '');
        if (/_PATTERN$/.test(name) || /RegExp/i.test(signature)) {
          return 'a matching pattern';
        }
        if (/_MAP$|_LOOKUP$/.test(name) || /Record</.test(signature)) {
          return 'a lookup object';
        }
        if (/_LIST$|_ITEMS$/.test(name) || /Array</.test(signature)) {
          return 'a shared list';
        }
        if (/_FLAG$|^IS_|^HAS_/.test(name) || signature === 'boolean') {
          return 'a boolean flag';
        }
        if (signature === 'string') {
          return 'a shared text value';
        }
        return 'a shared constant';
      }
      function describeBucketReason(node) {
        const incoming = Number(node.incomingCount) || 0;
        const outgoing = Number(node.outgoingCount) || 0;
        if (incoming >= 3) {
          return 'This showed up near the top because other tracked symbols rely on it.';
        }
        if (outgoing >= 8) {
          return 'This showed up because it pulls a lot of nearby code into one place.';
        }
        if (node.kind === 'constant') {
          return 'This looks like a smaller supporting value or pattern.';
        }
        return 'This looks like a smaller local piece that makes more sense after the higher-level flow.';
      }
      function explainWhyThisRanked(focus, renderedNames, incomingNames, outwardTrace, inwardTrace) {
        const inwardNames = uniqueNames((inwardTrace || []).map((edge) => readableTarget(edge.fromNodeId))).slice(0, 4);
        if (incomingNames.length) {
          return 'It landed near the top because these symbols point at it: ' + joinNatural(incomingNames.slice(0, 4)) + '.';
        }
        if (inwardNames.length) {
          return 'Even without direct callers, the wider trace still leads into it from ' + joinNatural(inwardNames.slice(0, 3)) + '.';
        }
        if (renderedNames.length) {
          return 'It landed in Big Local Pieces because it directly brings together ' + joinNatural(renderedNames.slice(0, 4)) + '.';
        }
        if (focus.outgoing.length >= 6) {
          return 'It landed in Big Local Pieces because it reaches into many nearby symbols, even though nothing else points back to it yet.';
        }
        return 'It showed up because it is one of the larger local pieces in this file area.';
      }
      function buildSoftCallout(focus, renderedNames, incomingNames, outwardTrace, inwardTrace) {
        const inwardNames = uniqueNames((inwardTrace || []).map((edge) => readableTarget(edge.fromNodeId))).slice(0, 3);
        if (focus.node.name === 'App') {
          return 'This is probably the first place to read if you want the overall shape of the app.';
        }
        if (incomingNames.length) {
          return 'Other tracked symbols already point back to this one, so it is a reasonable place to start.';
        }
        if (inwardNames.length) {
          return 'The wider trace still flows into this piece, so it is not as isolated as the direct callers make it look.';
        }
        if (renderedNames.length) {
          return 'This looks like a container piece rather than a tiny helper.';
        }
        if (focus.outgoing.length >= 6) {
          return 'This seems to gather a lot of nearby behavior into one place.';
        }
        return 'This seems like a smaller local piece.';
      }
      function friendlyNodeLabel(focus) {
        const renderedCount = focus.outgoing.filter((edge) => edge.edgeType === 'renders').length;
        if (focus.node.kind === 'component') return 'Component';
        if (focus.node.kind === 'function' && renderedCount >= 3) return 'Screen or panel function';
        if (focus.node.kind === 'function') return 'Function';
        if (focus.node.kind === 'constant') return 'Constant';
        return kindLabel(focus.node.kind);
      }
      function inferRoleLabel(focus, outwardTrace, inwardTrace) {
        const renderedCount = focus.outgoing.filter((edge) => edge.edgeType === 'renders').length;
        const incomingCount = focus.incoming.length;
        const outgoingCount = focus.outgoing.length;
        const outwardCount = (outwardTrace || []).length;
        const inwardCount = (inwardTrace || []).length;
        if (focus.node.name === 'App') return 'entry point';
        if (focus.node.kind === 'constant') return 'shared constant';
        if (focus.node.kind === 'component' && renderedCount >= 6) return 'screen or panel';
        if (focus.node.kind === 'component') return 'component';
        if (focus.node.kind === 'function' && renderedCount >= 4) return 'screen or panel';
        if (focus.node.kind === 'hook' && outgoingCount >= 4) return 'stateful hook';
        if (incomingCount >= 3 && outgoingCount >= 3) return 'shared coordinator';
        if (incomingCount >= 3) return 'shared helper';
        if (outgoingCount >= 6 || outwardCount >= 8) return 'local coordinator';
        if (inwardCount === 0 && outgoingCount <= 2) return 'leaf helper';
        return friendlyNodeLabel(focus).toLowerCase();
      }
      function describeSize(focus) {
        const lineCount = Math.max(1, (focus.node.spanEndLine || 1) - (focus.node.spanStartLine || 1) + 1);
        if (lineCount >= 400) return 'Very large';
        if (lineCount >= 150) return 'Large';
        if (lineCount >= 50) return 'Medium';
        return 'Small';
      }
      function joinNatural(items) {
        const values = items.filter(Boolean);
        if (values.length <= 1) return values[0] || '';
        if (values.length === 2) return values[0] + ' and ' + values[1];
        return values.slice(0, -1).join(', ') + ', and ' + values[values.length - 1];
      }
      function describeNodeKind(kind) {
        const map = { constant: 'a constant', function: 'a function', class: 'a class', component: 'a UI component', hook: 'a React hook', method: 'a class method', type: 'a type or interface', route: 'a route handler', store: 'a store or shared state holder', test: 'a test', api_client: 'an API client', job: 'a background job', module: 'a module' };
        return map[kind] || 'a code symbol';
      }
      function kindLabel(kind) { return String(kind).replaceAll('_', ' ').replace(/(^|\\s)\\S/g, (letter) => letter.toUpperCase()); }
      function humanizeResponsibility(responsibility) {
        const map = { presentation: 'showing UI', orchestration: 'coordinating other code', domain: 'core business logic', persistence: 'saving or loading data', adapter: 'connecting to outside systems', utility: 'small shared helper behavior', unknown: 'general application work' };
        return map[responsibility] || 'general application work';
      }
      function humanizeBoundary(boundary) {
        const map = { ui: 'the user interface', state: 'shared state', async: 'async work', network: 'network calls', persistence: 'saved data' };
        return map[boundary] || boundary;
      }
      function humanizeRisk(risk) {
        const map = { 'high fan-out': 'talks to many other pieces', 'high fan-in': 'many other pieces rely on it', 'touches network': 'reaches out over the network', 'touches persistence': 'reads or writes stored data', 'weak test linkage': 'does not appear strongly covered by tests' };
        return map[risk] || risk;
      }
      function shortPath(filePath) {
        const normalized = String(filePath).replaceAll('\\\\', '/');
        const root = state.workspacePath ? String(state.workspacePath).replaceAll('\\\\', '/') : '';
        return root && normalized.startsWith(root) ? normalized.slice(root.length + 1) : normalized;
      }
      function fileName(filePath) {
        const normalized = String(filePath).replaceAll('\\\\', '/');
        const parts = normalized.split('/');
        return parts[parts.length - 1] || normalized;
      }
      function expandFileForActiveNode() {}
      function readableTarget(value) {
        if (!value) return 'Unknown symbol';
        const text = String(value);
        if (text.includes('::')) {
          const parts = text.split('::');
          if (parts.length >= 2) {
            return parts[0];
          }
        }
        if (text.includes('/') || text.includes('\\\\')) return shortPath(text);
        return text;
      }
      function uniqueNames(values) { return [...new Set(values.filter(Boolean))]; }
      function escapeHtml(value) {
        return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
      }
      async function handleOpenWorkspace() {
        const folderPath = els.folderPath.value.trim();
        if (!folderPath) return;
        await openWorkspace(folderPath, false);
      }

      els.form.addEventListener('submit', (event) => {
        event.preventDefault();
      });
      els.openButton.addEventListener('click', () => { handleOpenWorkspace().catch((error) => setBanner(error.message)); });
      els.chooseFolderButton.addEventListener('click', () => { chooseFolder().catch((error) => setBanner(error.message)); });
      els.reindexButton.addEventListener('click', reindexWorkspace);
      els.searchInput.addEventListener('input', () => { loadNodes().catch((error) => setBanner(error.message)); });
      els.kindFilter.addEventListener('change', () => { loadNodes().catch((error) => setBanner(error.message)); });
      els.simpleViewButton.addEventListener('click', () => setViewMode('simple'));
      els.graphViewButton.addEventListener('click', () => setViewMode('graph'));
      els.nodeList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-node-id]');
        if (!button) return;
        loadFocus(button.getAttribute('data-node-id')).catch((error) => setBanner(error.message));
      });
      setWorkspaceControls(false);
      setLoading(false);
      setViewMode('simple');

      const initialFolderPath = new URLSearchParams(window.location.search).get('folderPath');
      if (initialFolderPath) {
        els.folderPath.value = initialFolderPath;
        handleOpenWorkspace().catch((error) => setBanner(error.message));
      }
    </script>
  </body>
</html>`;
}
