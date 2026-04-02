import { GraphDatabase } from '../sqlite';
import { CodeNode } from '../../contracts/nodes';

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
    return this.graph.raw().prepare('SELECT * FROM nodes WHERE id = ?').get(id) as CodeNode | undefined;
  }

  search(query?: string, kind?: string, limit = 250): CodeNode[] {
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
    return this.graph
      .raw()
      .prepare(`SELECT * FROM nodes ${where} ORDER BY name COLLATE NOCASE LIMIT ?`)
      .all(...params) as CodeNode[];
  }

  count(): number {
    const row = this.graph.raw().prepare('SELECT COUNT(*) AS count FROM nodes').get() as { count: number };
    return row.count;
  }

  byFile(filePath: string): CodeNode[] {
    return this.graph.raw().prepare('SELECT * FROM nodes WHERE file_path = ?').all(filePath) as CodeNode[];
  }
}
