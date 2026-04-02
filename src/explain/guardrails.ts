export function enforceGuardrails(summary: string): string {
  if (!summary.includes('exact') && !summary.includes('inference')) {
    return `${summary}\nTrust note: distinguish exact static facts from structural inferences.`;
  }
  return summary;
}
