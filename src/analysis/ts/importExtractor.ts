import * as crypto from 'crypto';
import * as ts from 'typescript';
import { CodeEdge } from '../../contracts/edges';

export function extractImportEdges(program: ts.Program): CodeEdge[] {
  const edges: CodeEdge[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!/\.(ts|tsx)$/.test(sf.fileName) || sf.isDeclarationFile) continue;
    sf.forEachChild((node) => {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) return;
      const target = node.moduleSpecifier.text;
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      const end = sf.getLineAndCharacterOfPosition(node.getEnd());
      const idSeed = `${sf.fileName}::imports::${target}::${pos.line}`;
      edges.push({
        id: crypto.createHash('sha1').update(idSeed).digest('hex'),
        fromNodeId: sf.fileName,
        toNodeId: target,
        edgeType: 'imports',
        evidence: 'static_exact',
        detail: node.getText(sf),
        sourceFilePath: sf.fileName,
        sourceStartLine: pos.line + 1,
        sourceEndLine: end.line + 1
      });
    });
  }

  return edges;
}
