export const logger = {
  info: (msg: string, extra?: unknown) => console.log(`[code-lens] ${msg}`, extra ?? ''),
  warn: (msg: string, extra?: unknown) => console.warn(`[code-lens] ${msg}`, extra ?? ''),
  error: (msg: string, extra?: unknown) => console.error(`[code-lens] ${msg}`, extra ?? '')
};
