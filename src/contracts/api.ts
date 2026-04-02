import { NodeFocus } from './lens';
import { TraceDirection, TraceFilter } from './trace';

export type LensMessage =
  | { type: 'focus'; payload: NodeFocus }
  | { type: 'empty'; payload: { reason: string; suggestions?: string[] } }
  | { type: 'trace'; payload: unknown }
  | { type: 'error'; payload: { message: string } };

export type LensBridgeRequest =
  | { type: 'refresh' }
  | { type: 'trace'; nodeId: string; direction: TraceDirection; filter?: TraceFilter };
