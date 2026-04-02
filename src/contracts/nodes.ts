export type CodeNodeKind =
  | 'file'
  | 'module'
  | 'function'
  | 'component'
  | 'hook'
  | 'class'
  | 'method'
  | 'type'
  | 'store'
  | 'route'
  | 'api_client'
  | 'job'
  | 'test';

export type ResponsibilityKind =
  | 'presentation'
  | 'orchestration'
  | 'domain'
  | 'persistence'
  | 'adapter'
  | 'utility'
  | 'unknown';

export type CodeNode = {
  id: string;
  kind: CodeNodeKind;
  name: string;
  filePath: string;
  modulePath?: string;
  signature?: string;
  spanStartLine: number;
  spanStartCol: number;
  spanEndLine: number;
  spanEndCol: number;
  responsibility: ResponsibilityKind;
};
