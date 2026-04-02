import { CodeEdgeType, EvidenceKind } from './edges';

export type TraceDirection = 'inward' | 'outward';

export type TraceFilter = {
  edgeTypes?: CodeEdgeType[];
  evidence?: EvidenceKind[];
  maxDepth?: number;
};
