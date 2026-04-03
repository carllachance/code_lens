import * as crypto from 'crypto';
import * as ts from 'typescript';
import { CodeEdge } from '../../contracts/edges';

export function extractReferenceEdges(program: ts.Program, targetFiles?: ReadonlySet<string>): CodeEdge[] {
  const edges: CodeEdge[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!/\.(ts|tsx)$/.test(sf.fileName) || sf.isDeclarationFile) continue;
    if (targetFiles && !targetFiles.has(sf.fileName)) continue;
    const checker = program.getTypeChecker();
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol?.declarations?.length) {
          const target = symbol.getName();
          const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          edges.push({
            id: crypto.createHash('sha1').update(`${sf.fileName}::declares::${target}::${pos.line}:${pos.character}`).digest('hex'),
            fromNodeId: sf.fileName,
            toNodeId: target,
            edgeType: 'declares',
            evidence: 'structural_match',
            sourceFilePath: sf.fileName,
            sourceStartLine: pos.line + 1,
            sourceEndLine: pos.line + 1
          });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sf);
  }

  return edges;
}
