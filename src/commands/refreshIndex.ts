import * as vscode from 'vscode';
import { Indexer } from '../analysis/indexer';

export async function refreshIndex(indexer: Indexer): Promise<void> {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Code Lens indexing' },
    (progress) => indexer.indexWorkspace(progress)
  );
}
