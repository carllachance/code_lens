import { EdgesRepo } from '../graph/repositories/edgesRepo';

export function getNeighborhood(nodeId: string, edgesRepo: EdgesRepo) {
  return {
    incoming: edgesRepo.incoming(nodeId),
    outgoing: edgesRepo.outgoing(nodeId)
  };
}
