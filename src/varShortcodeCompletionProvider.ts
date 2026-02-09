import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseYamlKeys } from './yamlParser';

/**
 * Cache entry for variables.
 */
interface CacheEntry {
  variables: string[];
  timestamp: number;
}

/**
 * Provides autocompletion for Quarto {{< var >}} shortcodes.
 * Reads variables from _variables.yml files.
 */
export class VarShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  // Cache for variables
  private cache = new Map<string, CacheEntry>();

  // Cache TTL in milliseconds (5 seconds)
  private static readonly CACHE_TTL = 5000;

  // Directories to ignore when scanning
  private static readonly IGNORE_DIRS = new Set([
    '.git',
    'node_modules',
    '_site',
    '_freeze',
    '.quarto',
    'out',
  ]);

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Check for var shortcode: {{< var ...
    const varMatch = textBeforeCursor.match(/\{\{<\s*var\s+([^>]*)$/);
    if (!varMatch) {
      return undefined;
    }

    const partialPath = varMatch[1].trim();

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return [];
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    const variables = this.getVariables(workspacePath);

    return this.createCompletionItems(variables, partialPath);
  }

  /**
   * Get variables from _variables.yml files with caching.
   */
  private getVariables(workspacePath: string): string[] {
    const now = Date.now();
    const cached = this.cache.get(workspacePath);

    if (cached && (now - cached.timestamp) < VarShortcodeCompletionProvider.CACHE_TTL) {
      return cached.variables;
    }

    const variables: string[] = [];
    const variablesFiles = this.findVariablesYmlFiles(workspacePath);

    for (const filePath of variablesFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const keys = parseYamlKeys(content);
        variables.push(...keys);
      } catch {
        continue;
      }
    }

    // Deduplicate and sort
    const uniqueVariables = [...new Set(variables)].sort();

    this.cache.set(workspacePath, {
      variables: uniqueVariables,
      timestamp: now,
    });

    return uniqueVariables;
  }

  /**
   * Find all _variables.yml files in the workspace.
   */
  private findVariablesYmlFiles(dir: string): string[] {
    const files: string[] = [];

    const scan = (currentDir: string): void => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!VarShortcodeCompletionProvider.IGNORE_DIRS.has(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile() && entry.name === '_variables.yml') {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  /**
   * Create completion items from a list of variable names.
   */
  private createCompletionItems(variables: string[], partialPath: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const variable of variables) {
      // Filter by partial path if user has typed something
      if (partialPath && !variable.toLowerCase().includes(partialPath.toLowerCase())) {
        continue;
      }

      const item = new vscode.CompletionItem(variable, vscode.CompletionItemKind.Variable);
      item.insertText = variable;
      item.detail = 'Variable from _variables.yml';
      item.sortText = variable;
      item.filterText = variable;

      items.push(item);
    }

    return items;
  }
}
