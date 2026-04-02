export function buildPrompt(bundle: string): string {
  return `Grounded summary request. Use only this evidence:\n${bundle}`;
}
