import { NodeFocus } from '../contracts/lens';
import { EdgesRepo } from '../graph/repositories/edgesRepo';
import { ExplanationsRepo } from '../graph/repositories/explanationsRepo';
import { NodesRepo } from '../graph/repositories/nodesRepo';

export function getNodeFocus(nodeId: string, repos: { nodes: NodesRepo; edges: EdgesRepo; explanations: ExplanationsRepo }): NodeFocus | undefined {
  const node = repos.nodes.getById(nodeId);
  if (!node) return undefined;

  const incoming = repos.edges.incoming(node.id);
  const outgoing = repos.edges.outgoing(node.id);
  const nearbyIds = new Set([...incoming.map((e) => e.fromNodeId), ...outgoing.map((e) => e.toNodeId)]);
  const nearbyNodes = [...nearbyIds].map((id) => repos.nodes.getById(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const relatedTests = nearbyNodes.filter((n) => n.kind === 'test');
  const boundaryFlags = [
    outgoing.some((e) => e.edgeType === 'renders') && 'ui',
    outgoing.some((e) => e.edgeType === 'reads_state' || e.edgeType === 'writes_state') && 'state',
    outgoing.some((e) => e.detail?.includes('async')) && 'async',
    outgoing.some((e) => e.edgeType === 'makes_request_to') && 'network',
    outgoing.some((e) => e.edgeType === 'persists_to') && 'persistence'
  ].filter((v): v is 'ui' | 'state' | 'async' | 'network' | 'persistence' => Boolean(v));

  const riskFlags: string[] = [];
  if (outgoing.length > 12) riskFlags.push('high fan-out');
  if (incoming.length > 12) riskFlags.push('high fan-in');
  if (boundaryFlags.includes('network')) riskFlags.push('touches network');
  if (boundaryFlags.includes('persistence')) riskFlags.push('touches persistence');
  if (relatedTests.length === 0) riskFlags.push('weak test linkage');

  return {
    node,
    explanation: repos.explanations.get(node.id),
    incoming,
    outgoing,
    relatedTests,
    nearbyNodes,
    boundaryFlags,
    riskFlags
  };
}
