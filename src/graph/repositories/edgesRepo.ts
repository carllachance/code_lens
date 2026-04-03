import { CodeEdge } from '../../contracts/edges';
import { GraphDatabase } from '../sqlite';

export class EdgesRepo {
  constructor(private readonly graph: GraphDatabase) {}

  upsert(edge: CodeEdge): void {
    const record = {
      ...edge,
      detail: edge.detail ?? null,
      sourceStartLine: edge.sourceStartLine ?? null,
      sourceEndLine: edge.sourceEndLine ?? null
    };

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
    ).run(record);
  }

  incoming(nodeId: string): CodeEdge[] {
    return (this.graph
      .raw()
      .prepare(this.selectEdgesSql('WHERE to_node_id = ?'))
      .all(nodeId) as Record<string, unknown>[])
      .map((row) => this.mapEdge(row));
  }

  outgoing(nodeId: string): CodeEdge[] {
    return (this.graph
      .raw()
      .prepare(this.selectEdgesSql('WHERE from_node_id = ?'))
      .all(nodeId) as Record<string, unknown>[])
      .map((row) => this.mapEdge(row));
  }

  deleteBySourceFilePath(filePath: string): void {
    this.graph.raw().prepare('DELETE FROM edges WHERE source_file_path = ?').run(filePath);
  }

  private selectEdgesSql(whereClause = ''): string {
    return `SELECT
      id,
      from_node_id AS fromNodeId,
      to_node_id AS toNodeId,
      edge_type AS edgeType,
      evidence,
      detail,
      source_file_path AS sourceFilePath,
      source_start_line AS sourceStartLine,
      source_end_line AS sourceEndLine
    FROM edges ${whereClause}`;
  }

  private mapEdge(row: Record<string, unknown>): CodeEdge {
    return row as unknown as CodeEdge;
  }
}
