import * as vscode from 'vscode';
import { extractCallEdges } from './ts/callEdgeExtractor';
import { extractImportEdges } from './ts/importExtractor';
import { ProgramManager } from './ts/programManager';
import { extractReferenceEdges } from './ts/referenceExtractor';
import { extractNodes } from './ts/symbolExtractor';
import { GraphDatabase } from '../graph/sqlite';
import { EdgesRepo } from '../graph/repositories/edgesRepo';
import { NodesRepo } from '../graph/repositories/nodesRepo';
import { logger } from '../util/logger';

export class Indexer {
  constructor(
    private readonly workspaceRoot: string,
    private readonly programManager: ProgramManager,
    private readonly graph: GraphDatabase
  ) {}

  async indexWorkspace(progress?: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
    const nodesRepo = new NodesRepo(this.graph);
    const edgesRepo = new EdgesRepo(this.graph);
    const program = this.programManager.getProgram();

    progress?.report({ message: 'Extracting symbols...', increment: 20 });
    const nodes = extractNodes(program, this.workspaceRoot);
    nodes.forEach((n) => nodesRepo.upsert(n));

    progress?.report({ message: 'Extracting imports/calls/references...', increment: 40 });
    const edges = [...extractImportEdges(program), ...extractCallEdges(program), ...extractReferenceEdges(program)];
    edges.forEach((e) => edgesRepo.upsert(e));

    progress?.report({ message: `Indexed ${nodes.length} nodes and ${edges.length} edges.`, increment: 40 });
    logger.info('Index complete', { nodes: nodes.length, edges: edges.length });
  }

  async reindexFile(_filePath: string): Promise<void> {
    this.programManager.invalidate();
    await this.indexWorkspace();
  }
}
