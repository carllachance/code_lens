import { getTrace } from '../queries/getTrace';
import { TracesRepo } from '../graph/repositories/tracesRepo';

export function traceInward(nodeId: string, tracesRepo: TracesRepo) {
  return getTrace(nodeId, 'inward', tracesRepo, { maxDepth: 3 });
}
