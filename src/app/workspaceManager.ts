import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Indexer, IndexProgressReporter } from '../analysis/indexer';
import { ProgramManager } from '../analysis/ts/programManager';
import { generateGroundedSummary } from '../explain/summaryGenerator';
import { GraphDatabase } from '../graph/sqlite';
import { EdgesRepo } from '../graph/repositories/edgesRepo';
import { ExplanationsRepo } from '../graph/repositories/explanationsRepo';
import { NodesRepo } from '../graph/repositories/nodesRepo';
import { TracesRepo } from '../graph/repositories/tracesRepo';
import { getNodeFocus } from '../queries/getNodeFocus';
import { getTrace } from '../queries/getTrace';

export type WorkspaceSummary = {
  id: string;
  folderPath: string;
  nodeCount: number;
  lastIndexedAt?: string;
  lastIndexMessage?: string;
};

type WorkspaceSession = {
  id: string;
  folderPath: string;
  graph: GraphDatabase;
  indexer: Indexer;
  nodes: NodesRepo;
  edges: EdgesRepo;
  explanations: ExplanationsRepo;
  traces: TracesRepo;
  lastIndexedAt?: string;
  lastIndexMessage?: string;
};

export class WorkspaceManager {
  private readonly sessions = new Map<string, WorkspaceSession>();

  async open(folderPath: string): Promise<WorkspaceSummary> {
    const normalizedPath = path.resolve(folderPath);
    const stats = fs.statSync(normalizedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${normalizedPath}`);
    }

    const existing = this.sessions.get(normalizedPath);
    if (existing) {
      return this.toSummary(existing);
    }

    const id = crypto.createHash('sha1').update(normalizedPath).digest('hex').slice(0, 12);
    const dbPath = path.join(os.homedir(), '.code-lens', 'workspaces', `${id}.sqlite`);
    const graph = new GraphDatabase(dbPath);
    const programManager = new ProgramManager(normalizedPath);
    const indexer = new Indexer(normalizedPath, programManager, graph);
    const nodes = new NodesRepo(graph);
    const edges = new EdgesRepo(graph);
    const explanations = new ExplanationsRepo(graph);
    const traces = new TracesRepo(edges);

    const session: WorkspaceSession = {
      id,
      folderPath: normalizedPath,
      graph,
      indexer,
      nodes,
      edges,
      explanations,
      traces
    };

    this.sessions.set(normalizedPath, session);
    return this.toSummary(session);
  }

  async reindex(folderPath: string): Promise<WorkspaceSummary> {
    const session = await this.getOrOpen(folderPath);
    const progress: IndexProgressReporter = {
      report: ({ message }) => {
        session.lastIndexMessage = message;
      }
    };

    await session.indexer.indexWorkspace(progress);
    session.lastIndexedAt = new Date().toISOString();
    return this.toSummary(session);
  }

  listNodes(folderPath: string, query?: string, kind?: string) {
    const session = this.requireSession(folderPath);
    return session.nodes.search(query, kind);
  }

  async getFocus(folderPath: string, nodeId: string) {
    const session = this.requireSession(folderPath);
    const focus = getNodeFocus(nodeId, {
      nodes: session.nodes,
      edges: session.edges,
      explanations: session.explanations
    });
    if (!focus) {
      return undefined;
    }

    if (!focus.explanation) {
      const explanation = await generateGroundedSummary(focus);
      session.explanations.upsert(explanation);
      return { ...focus, explanation };
    }

    return focus;
  }

  getTrace(folderPath: string, nodeId: string, direction: 'inward' | 'outward', maxDepth = 3) {
    const session = this.requireSession(folderPath);
    return getTrace(nodeId, direction, session.traces, { maxDepth });
  }

  closeAll(): void {
    for (const session of this.sessions.values()) {
      session.graph.close();
    }
    this.sessions.clear();
  }

  private async getOrOpen(folderPath: string): Promise<WorkspaceSession> {
    const normalizedPath = path.resolve(folderPath);
    const existing = this.sessions.get(normalizedPath);
    if (existing) {
      return existing;
    }

    await this.open(normalizedPath);
    return this.requireSession(normalizedPath);
  }

  private requireSession(folderPath: string): WorkspaceSession {
    const normalizedPath = path.resolve(folderPath);
    const session = this.sessions.get(normalizedPath);
    if (!session) {
      throw new Error(`Workspace is not open: ${normalizedPath}`);
    }
    return session;
  }

  private toSummary(session: WorkspaceSession): WorkspaceSummary {
    return {
      id: session.id,
      folderPath: session.folderPath,
      nodeCount: session.nodes.count(),
      lastIndexedAt: session.lastIndexedAt,
      lastIndexMessage: session.lastIndexMessage
    };
  }
}
