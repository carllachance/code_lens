import { CodeNode } from '../contracts/nodes';

export function getImpact(node: CodeNode, fanOut: number, testCount: number): string[] {
  const notes = [`Changes to ${node.name} can impact ${fanOut} direct downstream relationships.`];
  if (testCount === 0) notes.push('No directly linked tests were found. Validate behavior manually.');
  if (node.responsibility === 'adapter' || node.responsibility === 'persistence') {
    notes.push('Symbol likely sits on an external boundary; validate integration contracts.');
  }
  return notes;
}
