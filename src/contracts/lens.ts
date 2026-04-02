import { CodeEdge } from './edges';
import { CodeNode } from './nodes';

export type LensExplanation = {
  nodeId: string;
  summary: string;
  role: string;
  sideEffects: string[];
  dependencies: string[];
  impactNotes: string[];
  confidenceNotes: string[];
};

export type BoundaryFlag = 'ui' | 'state' | 'async' | 'network' | 'persistence';

export type NodeFocus = {
  node: CodeNode;
  explanation?: LensExplanation;
  incoming: CodeEdge[];
  outgoing: CodeEdge[];
  relatedTests: CodeNode[];
  nearbyNodes: CodeNode[];
  boundaryFlags: BoundaryFlag[];
  riskFlags: string[];
};
