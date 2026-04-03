import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { extractCallEdges } from './ts/callEdgeExtractor';
import { extractImportEdges } from './ts/importExtractor';
import { ProgramManager } from './ts/programManager';
import { extractReferenceEdges } from './ts/referenceExtractor';
import { extractNodes } from './ts/symbolExtractor';
import { extractJsxRenderEdges } from './ts/jsxComponentExtractor';
import { extractTestEdges } from './ts/testLinkExtractor';
import { GraphDatabase } from '../graph/sqlite';
import { EdgesRepo } from '../graph/repositories/edgesRepo';
import { ExplanationsRepo } from '../graph/repositories/explanationsRepo';
import { FilesRepo } from '../graph/repositories/filesRepo';
import { NodesRepo } from '../graph/repositories/nodesRepo';
import { logger } from '../util/logger';

export type IndexProgressReporter = {
  report(update: { message?: string; increment?: number }): void;
};

export class Indexer {
  constructor(
    private readonly workspaceRoot: string,
    private readonly programManager: ProgramManager,
    private readonly graph: GraphDatabase
  ) {}

  async indexWorkspace(progress?: IndexProgressReporter): Promise<void> {
    const nodesRepo = new NodesRepo(this.graph);
    const edgesRepo = new EdgesRepo(this.graph);
    const explanationsRepo = new ExplanationsRepo(this.graph);
    const filesRepo = new FilesRepo(this.graph);
    const trackedFiles = this.listTrackedFiles();
    const currentFiles = new Map(
      trackedFiles.map((filePath) => [
        filePath,
        {
          filePath,
          language: path.extname(filePath).replace(/^\./, '') || 'ts',
          hash: this.hashFile(filePath)
        }
      ])
    );
    const previousFiles = new Map(filesRepo.list().map((entry) => [entry.filePath, entry]));
    const changedFiles = trackedFiles.filter((filePath) => previousFiles.get(filePath)?.hash !== currentFiles.get(filePath)?.hash);
    const deletedFiles = [...previousFiles.keys()].filter((filePath) => !currentFiles.has(filePath));

    if (!changedFiles.length && !deletedFiles.length) {
      progress?.report({ message: 'No file changes detected. Reusing the existing index.', increment: 100 });
      logger.info('Index skipped; no file changes detected');
      return;
    }

    progress?.report({
      message: `Refreshing ${changedFiles.length} changed and ${deletedFiles.length} removed file(s)...`,
      increment: 10
    });

    deletedFiles.forEach((filePath) => {
      this.deleteFileData(filePath, nodesRepo, edgesRepo, explanationsRepo);
      filesRepo.delete(filePath);
    });

    if (changedFiles.length) {
      this.programManager.invalidate();
    }

    changedFiles.forEach((filePath) => this.deleteFileData(filePath, nodesRepo, edgesRepo, explanationsRepo));

    if (!changedFiles.length) {
      progress?.report({ message: 'Removed deleted files from the index.', increment: 90 });
      logger.info('Index complete after deletions only', { deletedFiles: deletedFiles.length });
      return;
    }

    const program = this.programManager.getProgram();
    const targetFiles = new Set(changedFiles);

    progress?.report({ message: 'Extracting symbols...', increment: 20 });
    const nodes = extractNodes(program, this.workspaceRoot, targetFiles);
    nodes.forEach((n) => nodesRepo.upsert(n));

    progress?.report({ message: 'Extracting imports/calls/references/renders/tests...', increment: 40 });
    const edges = [
      ...extractImportEdges(program, targetFiles),
      ...extractCallEdges(program, targetFiles),
      ...extractReferenceEdges(program, targetFiles),
      ...extractJsxRenderEdges(program, this.workspaceRoot, targetFiles),
      ...extractTestEdges(program, this.workspaceRoot, targetFiles)
    ];
    edges.forEach((e) => edgesRepo.upsert(e));
    changedFiles.forEach((filePath) => {
      const file = currentFiles.get(filePath);
      if (file) {
        filesRepo.upsert(file);
      }
    });

    progress?.report({
      message: `Updated ${changedFiles.length} file(s): ${nodes.length} nodes and ${edges.length} edges refreshed.`,
      increment: 30
    });
    logger.info('Incremental index complete', {
      changedFiles: changedFiles.length,
      deletedFiles: deletedFiles.length,
      nodes: nodes.length,
      edges: edges.length
    });
  }

  async reindexFile(filePath: string): Promise<void> {
    const normalizedPath = path.resolve(filePath);
    const nodesRepo = new NodesRepo(this.graph);
    const edgesRepo = new EdgesRepo(this.graph);
    const explanationsRepo = new ExplanationsRepo(this.graph);
    const filesRepo = new FilesRepo(this.graph);

    if (!fs.existsSync(normalizedPath)) {
      this.deleteFileData(normalizedPath, nodesRepo, edgesRepo, explanationsRepo);
      filesRepo.delete(normalizedPath);
      this.programManager.invalidate();
      return;
    }

    this.deleteFileData(normalizedPath, nodesRepo, edgesRepo, explanationsRepo);
    this.programManager.invalidate();
    const program = this.programManager.getProgram();
    const targetFiles = new Set([normalizedPath]);
    const nodes = extractNodes(program, this.workspaceRoot, targetFiles);
    const edges = [
      ...extractImportEdges(program, targetFiles),
      ...extractCallEdges(program, targetFiles),
      ...extractReferenceEdges(program, targetFiles),
      ...extractJsxRenderEdges(program, this.workspaceRoot, targetFiles),
      ...extractTestEdges(program, this.workspaceRoot, targetFiles)
    ];

    nodes.forEach((node) => nodesRepo.upsert(node));
    edges.forEach((edge) => edgesRepo.upsert(edge));
    filesRepo.upsert({
      filePath: normalizedPath,
      language: path.extname(normalizedPath).replace(/^\./, '') || 'ts',
      hash: this.hashFile(normalizedPath)
    });
  }

  private listTrackedFiles(): string[] {
    return tsFilePaths(this.workspaceRoot);
  }

  private hashFile(filePath: string): string {
    const contents = fs.readFileSync(filePath);
    return crypto.createHash('sha1').update(contents).digest('hex');
  }

  private deleteFileData(
    filePath: string,
    nodesRepo: NodesRepo,
    edgesRepo: EdgesRepo,
    explanationsRepo: ExplanationsRepo
  ): void {
    const nodeIds = nodesRepo.byFile(filePath).map((node) => node.id);
    explanationsRepo.deleteByNodeIds(nodeIds);
    edgesRepo.deleteBySourceFilePath(filePath);
    nodesRepo.deleteByFilePath(filePath);
  }
}

function tsFilePaths(workspaceRoot: string): string[] {
  const files: string[] = [];
  const stack = [workspaceRoot];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'out') {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}
