import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { schemaSql } from './schema';

export class GraphDatabase {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(schemaSql);
  }

  raw(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
