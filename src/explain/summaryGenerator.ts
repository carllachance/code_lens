import { LensExplanation } from '../contracts/lens';
import { NodeFocus } from '../contracts/lens';
import { enforceGuardrails } from './guardrails';

export async function generateGroundedSummary(focus: NodeFocus): Promise<LensExplanation> {
  const boundaryText = focus.boundaryFlags.length
    ? ` It touches ${focus.boundaryFlags.join(', ')}.`
    : '';
  const summary = enforceGuardrails(
    `${focus.node.name} is a ${focus.node.kind} in ${focus.node.filePath}. ` +
      `It currently shows ${focus.incoming.length} incoming links and ${focus.outgoing.length} outgoing links in this code graph.` +
      boundaryText
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
