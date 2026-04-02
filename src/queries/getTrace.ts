import { CodeEdge } from '../contracts/edges';
import { TraceDirection, TraceFilter } from '../contracts/trace';
import { TracesRepo } from '../graph/repositories/tracesRepo';

export function getTrace(nodeId: string, direction: TraceDirection, tracesRepo: TracesRepo, filter?: TraceFilter): CodeEdge[] {
  const base = tracesRepo.walk(nodeId, direction, filter?.maxDepth ?? 3);
  return base.filter((edge) => {
    if (filter?.edgeTypes && !filter.edgeTypes.includes(edge.edgeType)) return false;
    if (filter?.evidence && !filter.evidence.includes(edge.evidence)) return false;
    return true;
  });
}
