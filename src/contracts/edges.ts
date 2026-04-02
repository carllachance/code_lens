export type EvidenceKind =
  | 'static_exact'
  | 'structural_match'
  | 'runtime_observed'
  | 'model_inference';

export type CodeEdgeType =
  | 'imports'
  | 'exports'
  | 'declares'
  | 'calls'
  | 'renders'
  | 'uses_hook'
  | 'reads_state'
  | 'writes_state'
  | 'dispatches'
  | 'subscribes_to'
  | 'handles_route'
  | 'makes_request_to'
  | 'persists_to'
  | 'tested_by'
  | 'structurally_matches';

export type CodeEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: CodeEdgeType;
  evidence: EvidenceKind;
  detail?: string;
  sourceFilePath: string;
  sourceStartLine?: number;
  sourceEndLine?: number;
};
