import * as vscode from 'vscode';
import { makeNodeId } from '../analysis/normalize/nodeIds';
import { CodeNodeKind } from '../contracts/nodes';

export type ResolvedSymbol = {
  id: string;
  name: string;
  kind: vscode.SymbolKind;
  range: vscode.Range;
};

function toNodeKind(kind: vscode.SymbolKind, name: string): CodeNodeKind {
  if (kind === vscode.SymbolKind.Class) return 'class';
  if (kind === vscode.SymbolKind.Method) return 'method';
  if (kind === vscode.SymbolKind.Function) return name.startsWith('use') ? 'hook' : 'function';
  if (kind === vscode.SymbolKind.Interface || kind === vscode.SymbolKind.TypeParameter || kind === vscode.SymbolKind.Struct) return 'type';
  if (kind === vscode.SymbolKind.Variable) return /^[A-Z]/.test(name) ? 'component' : 'function';
  return 'function';
}

export async function resolveSymbolAtSelection(editor: vscode.TextEditor): Promise<ResolvedSymbol | undefined> {
  const position = editor.selection.active;
  const symbols = (await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri)) as vscode.DocumentSymbol[] | undefined;
  if (!symbols) return undefined;

  const flatten = (items: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] =>
    items.flatMap((item) => [item, ...flatten(item.children)]);

  const all = flatten(symbols).filter((s) => s.range.contains(position));
  const selected = all.sort((a, b) => a.range.end.line - a.range.start.line - (b.range.end.line - b.range.start.line))[0];
  if (!selected) return undefined;

  const nodeKind = toNodeKind(selected.kind, selected.name);
  const range = selected.range;
  const id = makeNodeId(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '', editor.document.uri.fsPath, nodeKind, selected.name, {
    startLine: range.start.line + 1,
    startCol: range.start.character + 1,
    endLine: range.end.line + 1,
    endCol: range.end.character + 1
  });

  return { id, name: selected.name, kind: selected.kind, range };
}
