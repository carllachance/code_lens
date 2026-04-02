import { EdgesRepo } from './edgesRepo';
import { CodeEdge } from '../../contracts/edges';

export class TracesRepo {
  constructor(private readonly edgesRepo: EdgesRepo) {}

  walk(startNodeId: string, direction: 'inward' | 'outward', maxDepth = 3): CodeEdge[] {
    const visited = new Set<string>();
    const result: CodeEdge[] = [];
    let frontier = [startNodeId];

    for (let depth = 0; depth < maxDepth; depth += 1) {
      const next: string[] = [];
      for (const id of frontier) {
        const edges = direction === 'outward' ? this.edgesRepo.outgoing(id) : this.edgesRepo.incoming(id);
        for (const edge of edges) {
          if (visited.has(edge.id)) continue;
          visited.add(edge.id);
          result.push(edge);
          next.push(direction === 'outward' ? edge.toNodeId : edge.fromNodeId);
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
    return result;
  }
}
