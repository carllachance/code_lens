import { LensExplanation } from '../contracts/lens';
import { NodeFocus } from '../contracts/lens';
import { enforceGuardrails } from './guardrails';

export async function generateGroundedSummary(focus: NodeFocus): Promise<LensExplanation> {
  const summary = enforceGuardrails(
    `${focus.node.name} is a ${focus.node.kind} in ${focus.node.filePath}. It has ${focus.incoming.length} incoming and ${focus.outgoing.length} outgoing relationships. ` +
      `Exact static facts come from compiler extraction; some relationship links are structural inference.`
  );

  return {
    nodeId: focus.node.id,
    summary,
    role: `${focus.node.responsibility}`,
    sideEffects: focus.boundaryFlags.map((x) => `Touches ${x} boundary.`).slice(0, 5),
    dependencies: focus.outgoing.map((x) => `${x.edgeType} -> ${x.toNodeId}`).slice(0, 5),
    impactNotes: focus.riskFlags.slice(0, 5),
    confidenceNotes: ['Static facts outrank structural matches in this summary.']
  };
}
