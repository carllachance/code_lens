import * as vscode from 'vscode';
import { Indexer } from '../analysis/indexer';

export async function reindexFile(indexer: Indexer): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await indexer.reindexFile(editor.document.uri.fsPath);
}
