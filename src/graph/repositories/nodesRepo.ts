import { GraphDatabase } from '../sqlite';
import { CodeNode, NodeListItem } from '../../contracts/nodes';

export class NodesRepo {
  constructor(private readonly graph: GraphDatabase) {}

  upsert(node: CodeNode): void {
    const record = {
      ...node,
      modulePath: node.modulePath ?? null,
      signature: node.signature ?? null
    };

    this.graph.raw().prepare(
      `INSERT INTO nodes (id, kind, name, file_path, module_path, signature, span_start_line, span_start_col, span_end_line, span_end_col, responsibility, updated_at)
       VALUES (@id, @kind, @name, @filePath, @modulePath, @signature, @spanStartLine, @spanStartCol, @spanEndLine, @spanEndCol, @responsibility, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         kind = excluded.kind,
         name = excluded.name,
         file_path = excluded.file_path,
         module_path = excluded.module_path,
         signature = excluded.signature,
         span_start_line = excluded.span_start_line,
         span_start_col = excluded.span_start_col,
         span_end_line = excluded.span_end_line,
         span_end_col = excluded.span_end_col,
         responsibility = excluded.responsibility,
         updated_at = datetime('now')`
    ).run(record);
  }

  getById(id: string): CodeNode | undefined {
    return this.mapNode(
      this.graph.raw().prepare(this.selectNodesSql('WHERE id = ?')).get(id) as Record<string, unknown> | undefined
    );
  }

  search(query?: string, kind?: string, limit = 250): NodeListItem[] {
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (query) {
      filters.push('(name LIKE ? OR id LIKE ? OR file_path LIKE ?)');
      const value = `%${query}%`;
      params.push(value, value, value);
    }

    if (kind) {
      filters.push('kind = ?');
      params.push(kind);
    }

    params.push(limit);
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    return (this.graph
      .raw()
      .prepare(`${this.selectNodeListSql(where)} LIMIT ?`)
      .all(...params) as Record<string, unknown>[])
      .map((row) => this.mapNodeListItem(row))
      .filter((node): node is NodeListItem => Boolean(node));
  }

  all(limit = 5000): CodeNode[] {
    return (this.graph
      .raw()
      .prepare(`${this.selectNodesSql('')} LIMIT ?`)
      .all(limit) as Record<string, unknown>[])
      .map((row) => this.mapNode(row))
      .filter((node): node is CodeNode => Boolean(node));
  }

  count(): number {
    const row = this.graph.raw().prepare('SELECT COUNT(*) AS count FROM nodes').get() as { count: number };
    return row.count;
  }

  byFile(filePath: string): CodeNode[] {
    return (this.graph
      .raw()
      .prepare(this.selectNodesSql('WHERE file_path = ?'))
      .all(filePath) as Record<string, unknown>[])
      .map((row) => this.mapNode(row))
      .filter((node): node is CodeNode => Boolean(node));
  }

  deleteByFilePath(filePath: string): void {
    this.graph.raw().prepare('DELETE FROM nodes WHERE file_path = ?').run(filePath);
  }

  private selectNodesSql(whereClause = ''): string {
    return `SELECT
      id,
      kind,
      name,
      file_path AS filePath,
      module_path AS modulePath,
      signature,
      span_start_line AS spanStartLine,
      span_start_col AS spanStartCol,
      span_end_line AS spanEndLine,
      span_end_col AS spanEndCol,
      responsibility
    FROM nodes ${whereClause}`;
  }

  private selectNodeListSql(whereClause = ''): string {
    return `SELECT
      id,
      kind,
      name,
      file_path AS filePath,
      module_path AS modulePath,
      signature,
      span_start_line AS spanStartLine,
      span_start_col AS spanStartCol,
      span_end_line AS spanEndLine,
      span_end_col AS spanEndCol,
      responsibility,
      (
        SELECT COUNT(*)
        FROM edges
        WHERE edges.to_node_id = nodes.id
      ) AS incomingCount,
      (
        SELECT COUNT(*)
        FROM edges
        WHERE edges.from_node_id = nodes.id
      ) AS outgoingCount,
      (
        (
          SELECT COUNT(*)
          FROM edges
          WHERE edges.to_node_id = nodes.id
        ) * 3
        +
        (
          SELECT COUNT(*)
          FROM edges
          WHERE edges.from_node_id = nodes.id
        ) * 2
        +
        CASE kind
          WHEN 'store' THEN 5
          WHEN 'route' THEN 5
          WHEN 'class' THEN 4
          WHEN 'component' THEN 4
          WHEN 'hook' THEN 3
          WHEN 'function' THEN 2
          WHEN 'method' THEN 2
          WHEN 'type' THEN 1
          WHEN 'constant' THEN 0
          ELSE 0
        END
      ) AS centralityScore
    FROM nodes
    ${whereClause}
    ORDER BY centralityScore DESC, incomingCount DESC, outgoingCount DESC, name COLLATE NOCASE`;
  }

  private mapNode(row: Record<string, unknown> | undefined): CodeNode | undefined {
    if (!row) {
      return undefined;
    }

    return row as unknown as CodeNode;
  }

  private mapNodeListItem(row: Record<string, unknown> | undefined): NodeListItem | undefined {
    if (!row) {
      return undefined;
    }

    const item = row as unknown as NodeListItem;
    const incomingCount = Number(item.incomingCount) || 0;
    const outgoingCount = Number(item.outgoingCount) || 0;
    const totalLinks = incomingCount + outgoingCount;

    return {
      ...item,
      incomingCount,
      outgoingCount,
      centralityScore: Number(item.centralityScore) || 0,
      complexityLabel:
        item.kind === 'constant'
          ? 'Reference'
          : totalLinks >= 18
            ? 'Very connected'
            : totalLinks >= 8
              ? 'Connected'
              : totalLinks >= 3
                ? 'Some wiring'
                : 'Small piece'
    };
  }
}
