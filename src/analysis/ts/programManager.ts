import * as path from 'path';
import * as ts from 'typescript';

export class ProgramManager {
  private program?: ts.Program;

  constructor(private readonly workspaceRoot: string) {}

  getProgram(): ts.Program {
    if (this.program) return this.program;
    const configPath = ts.findConfigFile(this.workspaceRoot, ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) {
      const files = ts.sys.readDirectory(this.workspaceRoot, ['.ts', '.tsx'], undefined, undefined);
      this.program = ts.createProgram(files, {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS
      });
      return this.program;
    }

    const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, path.dirname(configPath));
    this.program = ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options
    });
    return this.program;
  }

  invalidate(): void {
    this.program = undefined;
  }
}
