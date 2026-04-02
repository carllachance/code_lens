import { NodeFocus } from '../contracts/lens';

export function buildContextBundle(focus: NodeFocus): string {
  return JSON.stringify(
    {
      node: focus.node,
      incoming: focus.incoming,
      outgoing: focus.outgoing,
      relatedTests: focus.relatedTests.map((t) => t.name),
      boundaries: focus.boundaryFlags,
      riskFlags: focus.riskFlags
    },
    null,
    2
  );
}
