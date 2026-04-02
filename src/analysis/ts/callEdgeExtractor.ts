import * as crypto from 'crypto';
import * as ts from 'typescript';
import { CodeEdge } from '../../contracts/edges';

export function extractCallEdges(program: ts.Program): CodeEdge[] {
  const edges: CodeEdge[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!/\.(ts|tsx)$/.test(sf.fileName) || sf.isDeclarationFile) continue;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression.getText(sf);
        const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const end = sf.getLineAndCharacterOfPosition(node.getEnd());
        const idSeed = `${sf.fileName}::calls::${expr}::${pos.line}:${pos.character}`;
        edges.push({
          id: crypto.createHash('sha1').update(idSeed).digest('hex'),
          fromNodeId: sf.fileName,
          toNodeId: expr,
          edgeType: 'calls',
          evidence: 'structural_match',
          detail: node.getText(sf),
          sourceFilePath: sf.fileName,
          sourceStartLine: pos.line + 1,
          sourceEndLine: end.line + 1
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return edges;
}
