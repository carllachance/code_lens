import * as path from 'path';
import * as ts from 'typescript';
import { CodeNode, CodeNodeKind } from '../../contracts/nodes';
import { makeNodeId } from '../normalize/nodeIds';
import { classifyResponsibility } from './responsibilityClassifier';

export function extractNodes(program: ts.Program, workspaceRoot: string): CodeNode[] {
  const nodes: CodeNode[] = [];

  const checker = program.getTypeChecker();
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    if (!/\.(ts|tsx)$/.test(sourceFile.fileName)) continue;

    const pushNode = (kind: CodeNodeKind, name: string, n: ts.Node): void => {
      const start = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(n.getEnd());
      const snippet = n.getText(sourceFile);
      const resp = classifyResponsibility(kind, snippet);
      nodes.push({
        id: makeNodeId(workspaceRoot, sourceFile.fileName, kind, name, {
          startLine: start.line + 1,
          startCol: start.character + 1,
          endLine: end.line + 1,
          endCol: end.character + 1
        }),
        kind,
        name,
        filePath: sourceFile.fileName,
        signature: checker.typeToString(checker.getTypeAtLocation(n)),
        spanStartLine: start.line + 1,
        spanStartCol: start.character + 1,
        spanEndLine: end.line + 1,
        spanEndCol: end.character + 1,
        responsibility: resp.responsibility
      });
    };

    const visit = (n: ts.Node): void => {
      if (ts.isFunctionDeclaration(n) && n.name) {
        const nm = n.name.getText(sourceFile);
        const kind: CodeNodeKind = nm.startsWith('use') ? 'hook' : 'function';
        pushNode(kind, nm, n);
      }
      if (ts.isClassDeclaration(n) && n.name) {
        pushNode('class', n.name.getText(sourceFile), n);
      }
      if (ts.isMethodDeclaration(n) && n.name) {
        pushNode('method', n.name.getText(sourceFile), n);
      }
      if (ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n)) {
        pushNode('type', n.name.getText(sourceFile), n);
      }
      if (ts.isVariableStatement(n)) {
        n.declarationList.declarations.forEach((d) => {
          if (!ts.isIdentifier(d.name)) return;
          const nm = d.name.text;
          const initializerText = d.initializer?.getText(sourceFile) ?? '';
          const isJsxish = /<\w+/.test(initializerText);
          const kind: CodeNodeKind = nm.startsWith('use') ? 'hook' : isJsxish || /^[A-Z]/.test(nm) ? 'component' : 'function';
          pushNode(kind, nm, d);
        });
      }
      ts.forEachChild(n, visit);
    };

    const sfStart = sourceFile.getLineAndCharacterOfPosition(0);
    const sfEnd = sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd());
    const isTestFile = /(?:^|\/)(?:__tests__\/.*|.*(?:test|spec))\.(?:ts|tsx)$/.test(sourceFile.fileName.replace(/\\/g, '/'));
    nodes.push({
      id: makeNodeId(workspaceRoot, sourceFile.fileName, 'file', sourceFile.fileName, {
        startLine: sfStart.line + 1,
        startCol: sfStart.character + 1,
        endLine: sfEnd.line + 1,
        endCol: sfEnd.character + 1
      }),
      kind: 'file',
      name: sourceFile.fileName,
      filePath: sourceFile.fileName,
      spanStartLine: sfStart.line + 1,
      spanStartCol: sfStart.character + 1,
      spanEndLine: sfEnd.line + 1,
      spanEndCol: sfEnd.character + 1,
      responsibility: 'unknown'
    });


    if (isTestFile) {
      nodes.push({
        id: makeNodeId(workspaceRoot, sourceFile.fileName, 'test', sourceFile.fileName, {
          startLine: sfStart.line + 1,
          startCol: sfStart.character + 1,
          endLine: sfEnd.line + 1,
          endCol: sfEnd.character + 1
        }),
        kind: 'test',
        name: path.basename(sourceFile.fileName),
        filePath: sourceFile.fileName,
        spanStartLine: sfStart.line + 1,
        spanStartCol: sfStart.character + 1,
        spanEndLine: sfEnd.line + 1,
        spanEndCol: sfEnd.character + 1,
        responsibility: 'unknown'
      });
    }

    visit(sourceFile);
  }

  return nodes;
}
