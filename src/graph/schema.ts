export const schemaSql = `
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  module_path TEXT,
  signature TEXT,
  span_start_line INTEGER NOT NULL,
  span_start_col INTEGER NOT NULL,
  span_end_line INTEGER NOT NULL,
  span_end_col INTEGER NOT NULL,
  responsibility TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  evidence TEXT NOT NULL,
  detail TEXT,
  source_file_path TEXT NOT NULL,
  source_start_line INTEGER,
  source_end_line INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS explanations (
  node_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  role TEXT NOT NULL,
  side_effects_json TEXT NOT NULL,
  dependencies_json TEXT NOT NULL,
  impact_notes_json TEXT NOT NULL,
  confidence_notes_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pattern_hits (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  node_id TEXT,
  file_path TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  detail_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  file_path TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edges_from_node_id ON edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to_node_id ON edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_file_path ON nodes(file_path);
CREATE INDEX IF NOT EXISTS idx_pattern_hits_file_path ON pattern_hits(file_path);
`;
