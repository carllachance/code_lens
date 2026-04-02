import * as path from 'path';
import * as vscode from 'vscode';
import Database from 'better-sqlite3';
import { schemaSql } from './schema';

export class GraphDatabase {
  private readonly db: Database.Database;

  constructor(context: vscode.ExtensionContext) {
    const dbPath = path.join(context.globalStorageUri.fsPath, 'code-lens.sqlite');
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
