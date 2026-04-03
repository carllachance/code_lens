import { LensExplanation } from '../../contracts/lens';
import { GraphDatabase } from '../sqlite';

export class ExplanationsRepo {
  constructor(private readonly graph: GraphDatabase) {}

  upsert(explanation: LensExplanation): void {
    const record = {
      nodeId: explanation.nodeId,
      summary: explanation.summary,
      role: explanation.role,
      sideEffectsJson: JSON.stringify(explanation.sideEffects),
      dependenciesJson: JSON.stringify(explanation.dependencies),
      impactNotesJson: JSON.stringify(explanation.impactNotes),
      confidenceNotesJson: JSON.stringify(explanation.confidenceNotes)
    };

    this.graph
      .raw()
      .prepare(
        `INSERT INTO explanations (node_id, summary, role, side_effects_json, dependencies_json, impact_notes_json, confidence_notes_json, updated_at)
         VALUES (@nodeId, @summary, @role, @sideEffectsJson, @dependenciesJson, @impactNotesJson, @confidenceNotesJson, datetime('now'))
         ON CONFLICT(node_id) DO UPDATE SET
           summary = excluded.summary,
           role = excluded.role,
           side_effects_json = excluded.side_effects_json,
           dependencies_json = excluded.dependencies_json,
           impact_notes_json = excluded.impact_notes_json,
           confidence_notes_json = excluded.confidence_notes_json,
           updated_at = datetime('now')`
      )
      .run(record);
  }

  get(nodeId: string): LensExplanation | undefined {
    const row = this.graph
      .raw()
      .prepare(
        `SELECT
          node_id AS nodeId,
          summary,
          role,
          side_effects_json AS sideEffectsJson,
          dependencies_json AS dependenciesJson,
          impact_notes_json AS impactNotesJson,
          confidence_notes_json AS confidenceNotesJson
         FROM explanations
         WHERE node_id = ?`
      )
      .get(nodeId) as
      | {
          nodeId: string;
          summary: string;
          role: string;
          sideEffectsJson: string;
          dependenciesJson: string;
          impactNotesJson: string;
          confidenceNotesJson: string;
        }
      | undefined;

    if (!row) {
      return undefined;
    }

    return {
      nodeId: row.nodeId,
      summary: row.summary,
      role: row.role,
      sideEffects: JSON.parse(row.sideEffectsJson) as string[],
      dependencies: JSON.parse(row.dependenciesJson) as string[],
      impactNotes: JSON.parse(row.impactNotesJson) as string[],
      confidenceNotes: JSON.parse(row.confidenceNotesJson) as string[]
    };
  }

  deleteByNodeIds(nodeIds: string[]): void {
    if (!nodeIds.length) {
      return;
    }

    const placeholders = nodeIds.map(() => '?').join(', ');
    this.graph.raw().prepare(`DELETE FROM explanations WHERE node_id IN (${placeholders})`).run(...nodeIds);
  }
}
