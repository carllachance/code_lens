
      const state = { workspacePath: '', nodes: [], activeNodeId: '', focus: null, viewMode: 'simple', expandedFiles: {}, lastOutwardTrace: [], lastInwardTrace: [] };
      const els = {
        form: document.getElementById('workspace-form'), folderPath: document.getElementById('folder-path'), chooseFolderButton: document.getElementById('choose-folder-button'),
        openButton: document.getElementById('open-button'), reindexButton: document.getElementById('reindex-button'), workspaceStatus: document.getElementById('workspace-status'),
        loadingStatus: document.getElementById('loading-status'), sidebarTitle: document.getElementById('sidebar-title'), symbolSummary: document.getElementById('symbol-summary'),
        searchInput: document.getElementById('search-input'), kindFilter: document.getElementById('kind-filter'), nodeList: document.getElementById('node-list'),
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
        els.simpleViewButton.classList.toggle('active', mode === 'simple'); els.graphViewButton.classList.toggle('active', mode === 'graph');
        els.simpleViewButton.classList.toggle('ghost', mode !== 'simple'); els.graphViewButton.classList.toggle('ghost', mode !== 'graph');
        els.sidebarTitle.textContent = mode === 'simple' ? 'Walkthrough' : 'Symbols';
        renderNodes(); if (state.focus) renderDetail(state.focus, state.lastOutwardTrace || [], state.lastInwardTrace || []);
      }
      async function request(url, options = {}) {
        const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Request failed');
        return payload;
      }
      async function openWorkspace(folderPath, reindex = true) {
        setBanner(''); setLoading(true, reindex ? 'Indexing workspace...' : 'Opening workspace...', reindex ? 'Scanning files and building the symbol graph.' : 'Preparing the workspace view.');
        els.chooseFolderButton.disabled = true; els.openButton.disabled = true; els.workspaceStatus.textContent = 'Opening workspace...';
        try {
          const { workspace } = await request('/api/workspaces/open', { method: 'POST', body: JSON.stringify({ folderPath, reindex }) });
          state.workspacePath = workspace.folderPath; els.folderPath.value = workspace.folderPath;
          els.workspaceStatus.textContent = workspace.lastIndexedAt ? 'Indexed ' + workspace.nodeCount + ' symbols from ' + workspace.folderPath : 'Workspace ready: ' + workspace.folderPath;
          setWorkspaceControls(true); await loadNodes();
        } catch (error) { setBanner(error.message); els.workspaceStatus.textContent = 'Unable to open workspace.'; }
        finally { setLoading(false); els.chooseFolderButton.disabled = false; els.openButton.disabled = false; }
      }
      async function chooseFolder() {
        setBanner(''); setLoading(true, 'Waiting for folder selection...', 'Choose a local folder in the picker window.'); els.chooseFolderButton.disabled = true;
        try {
          const { folderPath } = await request('/api/system/pick-folder', { method: 'POST', body: JSON.stringify({}) });
          if (!folderPath) { setLoading(false); return; }
          els.folderPath.value = folderPath; await openWorkspace(folderPath, true);
        } catch (error) { setBanner(error.message); }
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
        els.symbolSummary.textContent = state.nodes.length ? state.nodes.length + ' symbols loaded' : 'No symbols loaded';
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
        const groups = groupNodesByFile(state.nodes);
        els.nodeList.innerHTML = groups.length ? groups.map((group) => {
          const expanded = !!state.expandedFiles[group.filePath];
          const fileActive = group.members.some((member) => member.id === state.activeNodeId);
          return '<div class="file-group">'
            + '<button class="file-button ' + (fileActive ? 'active' : '') + '" data-file-path="' + escapeHtml(group.filePath) + '" data-toggle-file="true">'
            + '<strong>' + escapeHtml(group.fileName) + '</strong>'
            + '<div class="file-meta">' + escapeHtml(group.relativePath) + ' - ' + group.members.length + ' items</div>'
            + '</button>'
            + (expanded ? '<div class="file-members">' + group.members.map((member) =>
                '<button class="member-button ' + (member.id === state.activeNodeId ? 'active' : '') + '" data-node-id="' + escapeHtml(member.id) + '">'
                + '<span class="member-kind">' + escapeHtml(kindLabel(member.kind)) + '</span>'
                + '<strong>' + escapeHtml(member.name) + '</strong>'
                + '<div class="node-meta">Line ' + member.spanStartLine + '</div>'
                + '</button>'
              ).join('') + '</div>' : '')
            + '</div>';
        }).join('') : '<div class="panel empty">No functions, classes, or other symbols matched this filter.</div>';
      }
      function renderEmptyDetail(message) {
        els.detailTitle.textContent = 'Workspace detail';
        els.detailSubtitle.textContent = 'Select a file member to see a simple explanation.';
        els.detailBody.innerHTML = '<div class="panel wide empty">' + escapeHtml(message) + '</div>';
      }
      function renderDetail(focus, outwardTrace, inwardTrace) {
        if (state.viewMode === 'simple') { renderSimpleDetail(focus); return; }
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
      function renderSimpleDetail(focus) {
        els.detailTitle.textContent = focus.node.name;
        els.detailSubtitle.textContent = kindLabel(focus.node.kind) + ' in ' + shortPath(focus.node.filePath) + ' at line ' + focus.node.spanStartLine;
        const outgoingNames = uniqueNames(focus.outgoing.map((edge) => readableTarget(edge.toNodeId))).slice(0, 6);
        const incomingNames = uniqueNames(focus.incoming.map((edge) => readableTarget(edge.fromNodeId))).slice(0, 6);
        const tests = focus.relatedTests.slice(0, 6);
        const boundaries = focus.boundaryFlags.map(humanizeBoundary);
        const risks = focus.riskFlags.map(humanizeRisk);
        els.detailBody.innerHTML = [
          '<div class="panel wide hero-panel"><h3>In Plain English</h3><p class="plain-summary">' + escapeHtml(buildPlainSummary(focus)) + '</p><p class="simple-callout">This is a ' + escapeHtml(kindLabel(focus.node.kind).toLowerCase()) + ' inside ' + escapeHtml(shortPath(focus.node.filePath)) + '.</p></div>',
          '<div class="panel"><h3>What This Does</h3><p>' + escapeHtml(buildPurposeSentence(focus)) + '</p></div>',
          '<div class="panel"><h3>Where It Lives</h3><p>' + escapeHtml(shortPath(focus.node.filePath)) + '</p><p class="simple-callout">Lines ' + focus.node.spanStartLine + ' to ' + focus.node.spanEndLine + '.</p></div>',
          '<div class="panel"><h3>What It Touches</h3>' + renderSimpleList(outgoingNames, 'It does not appear to call or link to other tracked symbols yet.') + '</div>',
          '<div class="panel"><h3>What Depends On It</h3>' + renderSimpleList(incomingNames, 'Nothing else in the tracked graph is pointing at it yet.') + '</div>',
          '<div class="panel"><h3>Things To Notice</h3>' + renderSimpleChips(boundaries, 'No major boundary crossings detected.') + '<div style="margin-top:14px;"><strong>Risk level</strong></div>' + renderSimpleChips(risks, 'No obvious risk signals.') + '</div>',
          '<div class="panel"><h3>Related Tests</h3>' + (tests.length ? '<div class="list">' + tests.map((test) => '<div class="list-item"><strong>' + escapeHtml(test.name) + '</strong><div class="node-meta">' + escapeHtml(shortPath(test.filePath)) + '</div></div>').join('') + '</div>' : '<p class="empty">No linked tests were found yet.</p>') + '</div>',
          '<div class="panel wide"><h3>How To Read This</h3><p>If you are new to the codebase, start with the plain-English summary, then scan "What it touches" to see nearby code, and finally open the related tests if you want examples of how this piece behaves.</p></div>'
        ].join('');
      }
      function renderSimpleList(items, emptyText) {
        return items.length ? '<div class="list">' + items.map((item) => '<div class="list-item">' + escapeHtml(item) + '</div>').join('') + '</div>' : '<p class="empty">' + escapeHtml(emptyText) + '</p>';
      }
      function renderSimpleChips(items, emptyText) {
        return items.length ? '<div class="chips">' + items.map((item) => '<span class="chip">' + escapeHtml(item) + '</span>').join('') + '</div>' : '<p class="empty">' + escapeHtml(emptyText) + '</p>';
      }
      function buildPlainSummary(focus) {
        const explanation = focus.explanation && focus.explanation.summary ? focus.explanation.summary : '';
        const role = humanizeResponsibility(focus.node.responsibility);
        const base = focus.node.name + ' is ' + describeNodeKind(focus.node.kind) + ' that mainly handles ' + role + '.';
        return explanation ? simplifySentence(explanation, base) : base + ' ' + buildPurposeSentence(focus);
      }
      function buildPurposeSentence(focus) {
        const outgoingCount = focus.outgoing.length; const incomingCount = focus.incoming.length;
        const boundaryText = focus.boundaryFlags.length ? ' It touches ' + focus.boundaryFlags.map(humanizeBoundary).join(', ') + '.' : '';
        return 'It has ' + outgoingCount + ' outgoing link' + (outgoingCount === 1 ? '' : 's') + ' and ' + incomingCount + ' incoming link' + (incomingCount === 1 ? '' : 's') + ' in the current code graph.' + boundaryText;
      }
      function simplifySentence(text, fallback) {
        const cleaned = String(text || '').replace(/static facts?|structural inference|compiler extraction/gi, '').replace(/\s+/g, ' ').trim();
        return cleaned || fallback;
      }
      function describeNodeKind(kind) {
        const map = { function: 'a function', class: 'a class', component: 'a UI component', hook: 'a React hook', method: 'a class method', type: 'a type or interface', route: 'a route handler', store: 'a store or shared state holder', test: 'a test', api_client: 'an API client', job: 'a background job', module: 'a module' };
        return map[kind] || 'a code symbol';
      }
      function kindLabel(kind) { return String(kind).replaceAll('_', ' ').replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()); }
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
        const normalized = String(filePath).replaceAll('\\', '/');
        const root = state.workspacePath ? String(state.workspacePath).replaceAll('\\', '/') : '';
        return root && normalized.startsWith(root) ? normalized.slice(root.length + 1) : normalized;
      }
      function fileName(filePath) {
        const normalized = String(filePath).replaceAll('\\', '/');
        const parts = normalized.split('/');
        return parts[parts.length - 1] || normalized;
      }
      function groupNodesByFile(nodes) {
        const groups = new Map();
        for (const node of nodes) { if (!groups.has(node.filePath)) groups.set(node.filePath, []); groups.get(node.filePath).push(node); }
        return [...groups.entries()].map(([filePath, members]) => ({ filePath, fileName: fileName(filePath), relativePath: shortPath(filePath), members: members.sort((a, b) => a.spanStartLine - b.spanStartLine || a.name.localeCompare(b.name)) })).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      }
      function expandFileForActiveNode() {
        const activeNode = state.nodes.find((node) => node.id === state.activeNodeId);
        if (activeNode) state.expandedFiles[activeNode.filePath] = true;
      }
      function readableTarget(value) {
        if (!value) return 'Unknown symbol';
        const text = String(value);
        if (text.includes('/') || text.includes('\\')) return shortPath(text);
        return text;
      }
      function uniqueNames(values) { return [...new Set(values.filter(Boolean))]; }
      function escapeHtml(value) {
        return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
      }
      els.form.addEventListener('submit', async (event) => {
        event.preventDefault(); const folderPath = els.folderPath.value.trim(); if (!folderPath) return; await openWorkspace(folderPath, true);
      });
      els.chooseFolderButton.addEventListener('click', () => { chooseFolder().catch((error) => setBanner(error.message)); });
      els.reindexButton.addEventListener('click', reindexWorkspace);
      els.searchInput.addEventListener('input', () => { loadNodes().catch((error) => setBanner(error.message)); });
      els.kindFilter.addEventListener('change', () => { loadNodes().catch((error) => setBanner(error.message)); });
      els.simpleViewButton.addEventListener('click', () => setViewMode('simple'));
      els.graphViewButton.addEventListener('click', () => setViewMode('graph'));
      els.nodeList.addEventListener('click', (event) => {
        const fileButton = event.target.closest('[data-toggle-file="true"]');
        if (fileButton) { const filePath = fileButton.getAttribute('data-file-path'); state.expandedFiles[filePath] = !state.expandedFiles[filePath]; renderNodes(); return; }
        const button = event.target.closest('[data-node-id]');
        if (!button) return;
        loadFocus(button.getAttribute('data-node-id')).catch((error) => setBanner(error.message));
      });
      setWorkspaceControls(false);
      setLoading(false);
      setViewMode('simple');
    
