import { GraphDatabase } from '../sqlite';

export type IndexedFileRecord = {
  filePath: string;
  language: string;
  hash: string;
  indexedAt: string;
};

export class FilesRepo {
  constructor(private readonly graph: GraphDatabase) {}

  list(): IndexedFileRecord[] {
    return this.graph
      .raw()
      .prepare('SELECT file_path AS filePath, language, hash, indexed_at AS indexedAt FROM files')
      .all() as IndexedFileRecord[];
  }

  upsert(file: { filePath: string; language: string; hash: string }): void {
    this.graph
      .raw()
      .prepare(
        `INSERT INTO files (file_path, language, hash, indexed_at)
         VALUES (@filePath, @language, @hash, datetime('now'))
         ON CONFLICT(file_path) DO UPDATE SET
           language = excluded.language,
           hash = excluded.hash,
           indexed_at = datetime('now')`
      )
      .run(file);
  }

  delete(filePath: string): void {
    this.graph.raw().prepare('DELETE FROM files WHERE file_path = ?').run(filePath);
  }

  getLastIndexedAt(): string | undefined {
    const row = this.graph.raw().prepare('SELECT MAX(indexed_at) AS lastIndexedAt FROM files').get() as {
      lastIndexedAt: string | null;
    };
    return row.lastIndexedAt ?? undefined;
  }
}
