export type PatternHit = {
  ruleId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  detail?: string;
};

export async function runAstGrepRules(): Promise<PatternHit[]> {
  return [];
}
