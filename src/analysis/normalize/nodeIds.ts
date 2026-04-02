import * as path from 'path';
import { CodeNodeKind } from '../../contracts/nodes';

export function makeNodeId(
  workspaceRoot: string,
  filePath: string,
  kind: CodeNodeKind,
  name: string,
  span: { startLine: number; startCol: number; endLine: number; endCol: number }
): string {
  const relPath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
  return `${relPath}::${kind}::${name}::${span.startLine}:${span.startCol}-${span.endLine}:${span.endCol}`;
}
