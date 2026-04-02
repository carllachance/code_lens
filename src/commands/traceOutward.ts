import { getTrace } from '../queries/getTrace';
import { TracesRepo } from '../graph/repositories/tracesRepo';

export function traceOutward(nodeId: string, tracesRepo: TracesRepo) {
  return getTrace(nodeId, 'outward', tracesRepo, { maxDepth: 3 });
}
