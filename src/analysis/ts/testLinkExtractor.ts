import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { CodeEdge } from '../../contracts/edges';
import { makeFileNodeId, makeTestNodeId } from '../normalize/nodeIds';

function resolveImportToFile(fromFilePath: string, importPath: string): string | undefined {
  if (!importPath.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromFilePath), importPath);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

export function extractTestEdges(
  program: ts.Program,
  workspaceRoot: string,
  targetFiles?: ReadonlySet<string>
): CodeEdge[] {
  const edges: CodeEdge[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!/\.(ts|tsx)$/.test(sf.fileName) || sf.isDeclarationFile) continue;
    if (targetFiles && !targetFiles.has(sf.fileName)) continue;
    const normalizedPath = sf.fileName.replace(/\\/g, '/');
    const isTestFile = /(?:^|\/)(?:__tests__\/.*|.*(?:test|spec))\.(?:ts|tsx)$/.test(normalizedPath);
    if (!isTestFile) continue;

    const testNodeId = makeTestNodeId(workspaceRoot, sf.fileName);

    sf.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
      const importedFile = resolveImportToFile(sf.fileName, node.moduleSpecifier.text);
      if (!importedFile) return;
      const importedFileId = makeFileNodeId(workspaceRoot, importedFile);
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      const end = sf.getLineAndCharacterOfPosition(node.getEnd());
      const idSeed = `${importedFileId}::tested_by::${testNodeId}::${pos.line}:${pos.character}`;

      edges.push({
        id: crypto.createHash('sha1').update(idSeed).digest('hex'),
        fromNodeId: importedFileId,
        toNodeId: testNodeId,
        edgeType: 'tested_by',
        evidence: 'structural_match',
        detail: `heuristic test import: ${node.moduleSpecifier.text}`,
        sourceFilePath: sf.fileName,
        sourceStartLine: pos.line + 1,
        sourceEndLine: end.line + 1
      });
    });
  }

  return edges;
}
