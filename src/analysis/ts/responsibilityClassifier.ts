import { CodeNodeKind, ResponsibilityKind } from '../../contracts/nodes';

export function classifyResponsibility(
  kind: CodeNodeKind,
  text: string
): { responsibility: ResponsibilityKind; reason: string } {
  if (kind === 'component' || /<\w+/.test(text)) {
    return { responsibility: 'presentation', reason: 'Returns or contains JSX.' };
  }
  if (/fetch\(|axios\.|client\./.test(text)) {
    return { responsibility: 'adapter', reason: 'Invokes network or external client APIs.' };
  }
  if (/localStorage|sessionStorage|persist|repository|db\./.test(text)) {
    return { responsibility: 'persistence', reason: 'Touches persistence APIs.' };
  }
  if (/use[A-Z]\w+\(/.test(text) || /dispatch\(/.test(text)) {
    return { responsibility: 'orchestration', reason: 'Coordinates hooks or actions.' };
  }
  if (kind === 'function' || kind === 'method') {
    return { responsibility: 'domain', reason: 'Contains procedural/business logic.' };
  }
  return { responsibility: 'utility', reason: 'No stronger signal detected.' };
}
