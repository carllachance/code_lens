import * as vscode from 'vscode';
import { Indexer } from './analysis/indexer';
import { ProgramManager } from './analysis/ts/programManager';
import { openLensPanel } from './commands/openLensPanel';
import { refreshIndex } from './commands/refreshIndex';
import { reindexFile } from './commands/reindexFile';
import { traceInward } from './commands/traceInward';
import { traceOutward } from './commands/traceOutward';
import { registerSelectionTracker } from './editor/selectionTracker';
import { ExplanationsRepo } from './graph/repositories/explanationsRepo';
import { EdgesRepo } from './graph/repositories/edgesRepo';
import { NodesRepo } from './graph/repositories/nodesRepo';
import { TracesRepo } from './graph/repositories/tracesRepo';
import { GraphDatabase } from './graph/sqlite';
import { generateGroundedSummary } from './explain/summaryGenerator';
import { getNodeFocus } from './queries/getNodeFocus';
import { LensPanel } from './webview/panel';

let activeGraph: GraphDatabase | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) return;

  const graph = new GraphDatabase(context);
  activeGraph = graph;
  const programManager = new ProgramManager(workspaceRoot);
  const indexer = new Indexer(workspaceRoot, programManager, graph);

  const nodesRepo = new NodesRepo(graph);
  const edgesRepo = new EdgesRepo(graph);
  const explanationsRepo = new ExplanationsRepo(graph);
  const tracesRepo = new TracesRepo(edgesRepo);

  const panel = new LensPanel(context);

  const updateFocus = async (nodeId: string): Promise<void> => {
    const focus = getNodeFocus(nodeId, { nodes: nodesRepo, edges: edgesRepo, explanations: explanationsRepo });
    if (!focus) {
      panel.showEmpty('This symbol is identified, but the repo has not been indexed yet.', ['Run Code Lens: Refresh Index']);
      return;
    }

    panel.showFocus(focus);
    if (!focus.explanation) {
      const explanation = await generateGroundedSummary(focus);
      explanationsRepo.upsert(explanation);
      panel.showFocus({ ...focus, explanation });
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('codeLens.openPanel', () => openLensPanel(panel)),
    vscode.commands.registerCommand('codeLens.refreshIndex', () => refreshIndex(indexer)),
    vscode.commands.registerCommand('codeLens.reindexCurrentFile', () => reindexFile(indexer)),
    vscode.commands.registerCommand('codeLens.traceOutward', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const symbol = await import('./editor/symbolResolver').then((m) => m.resolveSymbolAtSelection(editor));
      if (!symbol) return;
      panel.post({ type: 'trace', payload: traceOutward(symbol.id, tracesRepo) });
    }),
    vscode.commands.registerCommand('codeLens.traceInward', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const symbol = await import('./editor/symbolResolver').then((m) => m.resolveSymbolAtSelection(editor));
      if (!symbol) return;
      panel.post({ type: 'trace', payload: traceInward(symbol.id, tracesRepo) });
    }),
    vscode.commands.registerCommand('codeLens.showNeighborhood', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const symbol = await import('./editor/symbolResolver').then((m) => m.resolveSymbolAtSelection(editor));
      if (!symbol) return;
      await updateFocus(symbol.id);
    }),
    vscode.commands.registerCommand('codeLens.toggleEvidenceFilter', () => panel.post({ type: 'toggleEvidenceFilter' }))
  );

  registerSelectionTracker(context, async (nodeId) => {
    panel.open();
    await updateFocus(nodeId);
  });
}

export function deactivate(): void {
  activeGraph?.close();
  activeGraph = undefined;
}
