import * as path from 'path';

export const isTsLike = (filePath: string): boolean => /\.(ts|tsx)$/.test(filePath);

export const toUnix = (value: string): string => value.replace(/\\/g, '/');

export const asWorkspaceRelative = (workspaceRoot: string, value: string): string =>
  toUnix(path.relative(workspaceRoot, value));
