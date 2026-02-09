import * as vscode from 'vscode';
import * as path from 'path';
import { traverseUpwards, safeReadFile } from './utils';
import { parseYamlKeys, parseFrontMatter } from './yamlParser';

/**
 * Provides autocompletion for Quarto {{< meta >}} shortcodes.
 * Reads metadata from YAML front matter and _quarto.yml files.
 */
export class MetaShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Check for meta shortcode: {{< meta ...
    const metaMatch = textBeforeCursor.match(/\{\{<\s*meta\s+([^>]*)$/);
    if (!metaMatch) {
      return undefined;
    }

    const partialPath = metaMatch[1].trim();
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const documentPath = document.uri.fsPath;

    const metaKeys: Set<string> = new Set();

    // Parse front matter from current document
    const documentText = document.getText();
    const frontMatterKeys = parseFrontMatter(documentText);
    for (const key of frontMatterKeys) {
      metaKeys.add(key);
    }

    // Parse _quarto.yml files
    if (workspaceFolder) {
      const quartoYmlKeys = this.getQuartoYmlKeys(workspaceFolder.uri.fsPath, documentPath);
      for (const key of quartoYmlKeys) {
        metaKeys.add(key);
      }
    }

    return this.createCompletionItems(Array.from(metaKeys).sort(), partialPath);
  }

  /**
   * Get keys from _quarto.yml files.
   */
  private getQuartoYmlKeys(workspacePath: string, documentPath: string): string[] {
    const keys: string[] = [];

    // Find _quarto.yml files from document directory up to workspace root
    for (const dir of traverseUpwards(documentPath, workspacePath)) {
      const quartoYmlPath = path.join(dir, '_quarto.yml');
      const content = safeReadFile(quartoYmlPath);
      if (content) {
        keys.push(...parseYamlKeys(content));
      }
    }

    return keys;
  }

  /**
   * Create completion items from a list of metadata keys.
   */
  private createCompletionItems(keys: string[], partialPath: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const key of keys) {
      // Filter by partial path if user has typed something
      if (partialPath && !key.toLowerCase().includes(partialPath.toLowerCase())) {
        continue;
      }

      const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
      item.insertText = key;
      item.detail = 'Metadata field';
      item.sortText = key;
      item.filterText = key;

      items.push(item);
    }

    return items;
  }
}
