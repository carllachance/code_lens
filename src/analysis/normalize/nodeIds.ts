import * as path from 'path';
import { CodeNodeKind } from '../../contracts/nodes';

export type SymbolSpan = {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
};

function normalizeRelPath(workspaceRoot: string, filePath: string): string {
  if (!workspaceRoot) return filePath.replace(/\\/g, '/');
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

export function makeNodeId(
  workspaceRoot: string,
  filePath: string,
  kind: CodeNodeKind,
  name: string,
  span: SymbolSpan
): string {
  const relPath = normalizeRelPath(workspaceRoot, filePath);
  return `${relPath}::${kind}::${name}::${span.startLine}:${span.startCol}-${span.endLine}:${span.endCol}`;
}

export function makeFileNodeId(workspaceRoot: string, filePath: string): string {
  return makeNodeId(workspaceRoot, filePath, 'file', filePath, {
    startLine: 1,
    startCol: 1,
    endLine: 1,
    endCol: 1
  });
}

export function makeTestNodeId(workspaceRoot: string, filePath: string): string {
  return makeNodeId(workspaceRoot, filePath, 'test', filePath, {
    startLine: 1,
    startCol: 1,
    endLine: 1,
    endCol: 1
  });
}
