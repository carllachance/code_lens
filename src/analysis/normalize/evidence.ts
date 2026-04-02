import { EvidenceKind } from '../../contracts/edges';

export const EvidenceRank: Record<EvidenceKind, number> = {
  static_exact: 4,
  structural_match: 3,
  runtime_observed: 2,
  model_inference: 1
};
