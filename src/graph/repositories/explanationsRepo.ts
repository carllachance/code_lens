import { GraphDatabase } from '../sqlite';
import { LensExplanation } from '../../contracts/lens';

export class ExplanationsRepo {
  constructor(private readonly graph: GraphDatabase) {}

  upsert(value: LensExplanation): void {
    this.graph.raw().prepare(
      `INSERT INTO explanations (node_id, summary, role, side_effects_json, dependencies_json, impact_notes_json, confidence_notes_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(node_id) DO UPDATE SET
         summary = excluded.summary,
         role = excluded.role,
         side_effects_json = excluded.side_effects_json,
         dependencies_json = excluded.dependencies_json,
         impact_notes_json = excluded.impact_notes_json,
         confidence_notes_json = excluded.confidence_notes_json,
         updated_at = datetime('now')`
    ).run(
      value.nodeId,
      value.summary,
      value.role,
      JSON.stringify(value.sideEffects),
      JSON.stringify(value.dependencies),
      JSON.stringify(value.impactNotes),
      JSON.stringify(value.confidenceNotes)
    );
  }

  get(nodeId: string): LensExplanation | undefined {
    const row = this.graph.raw().prepare('SELECT * FROM explanations WHERE node_id = ?').get(nodeId) as any;
    if (!row) return undefined;
    return {
      nodeId: row.node_id,
      summary: row.summary,
      role: row.role,
      sideEffects: JSON.parse(row.side_effects_json),
      dependencies: JSON.parse(row.dependencies_json),
      impactNotes: JSON.parse(row.impact_notes_json),
      confidenceNotes: JSON.parse(row.confidence_notes_json)
    };
  }
}
