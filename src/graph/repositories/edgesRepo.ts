import { CodeEdge } from '../../contracts/edges';
import { GraphDatabase } from '../sqlite';

export class EdgesRepo {
  constructor(private readonly graph: GraphDatabase) {}

  upsert(edge: CodeEdge): void {
    this.graph.raw().prepare(
      `INSERT INTO edges (id, from_node_id, to_node_id, edge_type, evidence, detail, source_file_path, source_start_line, source_end_line, updated_at)
       VALUES (@id, @fromNodeId, @toNodeId, @edgeType, @evidence, @detail, @sourceFilePath, @sourceStartLine, @sourceEndLine, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         from_node_id = excluded.from_node_id,
         to_node_id = excluded.to_node_id,
         edge_type = excluded.edge_type,
         evidence = excluded.evidence,
         detail = excluded.detail,
         source_file_path = excluded.source_file_path,
         source_start_line = excluded.source_start_line,
         source_end_line = excluded.source_end_line,
         updated_at = datetime('now')`
    ).run(edge);
  }

  incoming(nodeId: string): CodeEdge[] {
    return this.graph.raw().prepare('SELECT * FROM edges WHERE to_node_id = ?').all(nodeId) as CodeEdge[];
  }

  outgoing(nodeId: string): CodeEdge[] {
    return this.graph.raw().prepare('SELECT * FROM edges WHERE from_node_id = ?').all(nodeId) as CodeEdge[];
  }
}
