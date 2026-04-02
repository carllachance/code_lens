import * as vscode from 'vscode';
import { NodeFocus } from '../contracts/lens';

export class LensPanel {
  private panel?: vscode.WebviewPanel;

  constructor(private readonly context: vscode.ExtensionContext) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }
    this.panel = vscode.window.createWebviewPanel('codeLensPanel', 'Code Lens', vscode.ViewColumn.Beside, { enableScripts: true });
    this.panel.webview.html = this.render();
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'ready') {
        this.post({ type: 'empty', payload: { reason: 'Move the cursor onto a supported symbol.' } });
      }
    });
  }

  post(message: unknown): void {
    this.panel?.webview.postMessage(message);
  }

  showFocus(focus: NodeFocus): void {
    this.post({ type: 'focus', payload: focus });
  }

  showEmpty(reason: string, suggestions: string[] = []): void {
    this.post({ type: 'empty', payload: { reason, suggestions } });
  }

  private render(): string {
    return `<!DOCTYPE html>
<html>
  <body>
    <div id="app">Loading…</div>
    <script>
      const vscode = acquireVsCodeApi();
      const app = document.getElementById('app');
      const EVIDENCE_LABELS = {
        static_exact: { label: 'Exact static fact', badge: '#2f855a' },
        structural_match: { label: 'Heuristic structural match', badge: '#b7791f' },
        runtime_observed: { label: 'Runtime observation', badge: '#2b6cb0' },
        model_inference: { label: 'Model inference', badge: '#805ad5' }
      };

      const escapeHtml = (value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

      const edgeItem = (e) => {
        const evidence = EVIDENCE_LABELS[e.evidence] || { label: e.evidence, badge: '#718096' };
        return '<li style="margin-bottom:8px;">'
          + '<div><strong>' + escapeHtml(e.edgeType) + '</strong> → <code>' + escapeHtml(e.toNodeId) + '</code></div>'
          + '<div style="font-size:12px;color:#555;">' + escapeHtml(e.detail || 'No detail') + '</div>'
          + '<span style="display:inline-block;margin-top:4px;padding:2px 6px;border-radius:12px;background:' + evidence.badge + ';color:white;font-size:11px;">'
          + escapeHtml(evidence.label)
          + '</span>'
          + '</li>';
      };

      const section = (title, body) =>
        '<section style="margin-bottom:16px; border:1px solid #ddd; border-radius:8px; padding:10px;">'
        + '<h3 style="margin:0 0 8px 0;">' + title + '</h3>'
        + body
        + '</section>';

      const renderFocus = (f) => {
        const incoming = f.incoming.length ? '<ul>' + f.incoming.map(edgeItem).join('') + '</ul>' : '<p>None.</p>';
        const outgoing = f.outgoing.length ? '<ul>' + f.outgoing.map(edgeItem).join('') + '</ul>' : '<p>None.</p>';
        const boundaries = f.boundaryFlags.length ? '<ul>' + f.boundaryFlags.map((b) => '<li>' + escapeHtml(b) + '</li>').join('') + '</ul>' : '<p>None detected.</p>';
        const tests = (f.relatedTests || []).length
          ? '<ul>' + f.relatedTests.map((t) => '<li>' + escapeHtml(t.name) + ' (' + escapeHtml(t.filePath) + ')</li>').join('') + '</ul>'
          : '<p>No related tests found.</p>';

        app.innerHTML = [
          section('Identity',
            '<div><strong>' + escapeHtml(f.node.name) + '</strong> (' + escapeHtml(f.node.kind) + ')</div>'
            + '<div><code>' + escapeHtml(f.node.id) + '</code></div>'
            + '<div>' + escapeHtml(f.node.filePath) + ':' + f.node.spanStartLine + '-' + f.node.spanEndLine + '</div>'
          ),
          section('Explanation', '<p>' + escapeHtml(f.explanation?.summary ?? 'No explanation yet; graph evidence only.') + '</p>'),
          section('Incoming edges', incoming),
          section('Outgoing edges', outgoing),
          section('Boundaries', boundaries),
          section('Related tests', tests),
          section('Evidence legend',
            '<ul>'
              + '<li><strong>Exact static fact</strong>: parser/compiler proven.</li>'
              + '<li><strong>Heuristic structural match</strong>: likely true pattern match.</li>'
              + '<li><strong>Runtime observation</strong>: seen while running.</li>'
              + '<li><strong>Model inference</strong>: inferred, not directly observed.</li>'
            + '</ul>'
          )
        ].join('');
      };

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'focus') renderFocus(message.payload);
        if (message.type === 'empty') {
          app.innerHTML = '<p>' + message.payload.reason + '</p><p>' + (message.payload.suggestions || []).join(', ') + '</p>';
        }
      });
      vscode.postMessage({ type: 'ready' });
    </script>
  </body>
</html>`;
  }
}
