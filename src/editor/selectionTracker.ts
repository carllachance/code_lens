import * as vscode from 'vscode';
import { debounce } from '../util/debounce';
import { resolveSymbolAtSelection } from './symbolResolver';

export function registerSelectionTracker(
  context: vscode.ExtensionContext,
  onSymbol: (id: string) => Promise<void>
): void {
  const handler = debounce(async (editor?: vscode.TextEditor) => {
    if (!editor || !['typescript', 'typescriptreact'].includes(editor.document.languageId)) return;
    const resolved = await resolveSymbolAtSelection(editor);
    if (!resolved) return;
    await onSymbol(resolved.id);
  }, 150);

  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((e) => handler(e.textEditor)));
}
