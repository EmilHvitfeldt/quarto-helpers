import * as vscode from 'vscode';
import { CacheManager, findFilesByName, safeReadFile, DEFAULT_IGNORE_DIRS } from './utils';
import { parseYamlKeys } from './yamlParser';

/**
 * Provides autocompletion for Quarto {{< var >}} shortcodes.
 * Reads variables from _variables.yml files.
 */
export class VarShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  // Cache for variables
  private cache = new CacheManager<string[]>();

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
    return this.cache.getOrCompute(workspacePath, () => {
      const variables: string[] = [];
      const variablesFiles = findFilesByName(workspacePath, '_variables.yml', DEFAULT_IGNORE_DIRS);

      for (const filePath of variablesFiles) {
        const content = safeReadFile(filePath);
        if (content) {
          const keys = parseYamlKeys(content);
          variables.push(...keys);
        }
      }

      // Deduplicate and sort
      return [...new Set(variables)].sort();
    });
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
