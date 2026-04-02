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
      const renderFocus = (f) => {
        app.innerHTML =
          '<h2>' + f.node.name + '</h2>' +
          '<p><strong>Kind:</strong> ' + f.node.kind + ' | <strong>Responsibility:</strong> ' + f.node.responsibility + '</p>' +
          '<p><strong>File:</strong> ' + f.node.filePath + ':' + f.node.spanStartLine + '-' + f.node.spanEndLine + '</p>' +
          '<h3>Summary</h3>' +
          '<p>' + (f.explanation?.summary ?? 'No explanation yet; graph facts shown below.') + '</p>' +
          '<h3>Wiring</h3>' +
          '<p>Incoming: ' + f.incoming.length + ' | Outgoing: ' + f.outgoing.length + '</p>' +
          '<h3>Boundaries</h3>' +
          '<p>' + (f.boundaryFlags.join(', ') || 'None detected') + '</p>' +
          '<h3>Related tests</h3>' +
          '<p>' + ((f.relatedTests || []).map((t) => t.name).join(', ') || 'No related tests found') + '</p>' +
          '<h3>Trust</h3>' +
          '<p>Each edge has evidence labels: static_exact, structural_match, runtime_observed, model_inference.</p>';
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
