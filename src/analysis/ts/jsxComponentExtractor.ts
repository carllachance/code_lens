import * as crypto from 'crypto';
import * as ts from 'typescript';
import { CodeEdge } from '../../contracts/edges';
import { makeFileNodeId, makeNodeId } from '../normalize/nodeIds';

export function extractJsxRenderEdges(program: ts.Program, workspaceRoot: string): CodeEdge[] {
  const edges: CodeEdge[] = [];

  for (const sf of program.getSourceFiles()) {
    if (!/\.(ts|tsx)$/.test(sf.fileName) || sf.isDeclarationFile) continue;

    const visit = (node: ts.Node, currentOwnerId: string): void => {
      let ownerId = currentOwnerId;

      if (ts.isFunctionDeclaration(node) && node.name) {
        const start = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        const end = sf.getLineAndCharacterOfPosition(node.getEnd());
        ownerId = makeNodeId(workspaceRoot, sf.fileName, 'function', node.name.text, {
          startLine: start.line + 1,
          startCol: start.character + 1,
          endLine: end.line + 1,
          endCol: end.character + 1
        });
      }

      if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
        if (ts.isIdentifier(node.tagName) && /^[A-Z]/.test(node.tagName.text)) {
          const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          const end = sf.getLineAndCharacterOfPosition(node.getEnd());
          const toNodeId = `${node.tagName.text}::component`;
          const idSeed = `${ownerId}::renders::${toNodeId}::${pos.line}:${pos.character}`;
          edges.push({
            id: crypto.createHash('sha1').update(idSeed).digest('hex'),
            fromNodeId: ownerId,
            toNodeId,
            edgeType: 'renders',
            evidence: 'structural_match',
            detail: `heuristic JSX render: ${node.tagName.text}`,
            sourceFilePath: sf.fileName,
            sourceStartLine: pos.line + 1,
            sourceEndLine: end.line + 1
          });
        }
      }

      ts.forEachChild(node, (child) => visit(child, ownerId));
    };

    visit(sf, makeFileNodeId(workspaceRoot, sf.fileName));
  }

  return edges;
}
