import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CacheManager, traverseUpwards, safeReadFile } from './utils';

/**
 * Built-in Quarto shortcode information.
 */
interface ShortcodeInfo {
  name: string;
  description: string;
}

/**
 * Provides autocompletion for Quarto shortcodes.
 * Suggests both built-in shortcodes and custom shortcodes from extensions.
 */
export class ShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  // Cache for extension shortcodes
  private cache = new CacheManager<ShortcodeInfo[]>();

  // Built-in Quarto shortcodes
  private static readonly BUILTIN_SHORTCODES: ShortcodeInfo[] = [
    { name: 'include', description: 'Include content from another file' },
    { name: 'var', description: 'Output value from _variables.yml' },
    { name: 'meta', description: 'Print document metadata value' },
    { name: 'env', description: 'Retrieve environment variable value' },
    { name: 'pagebreak', description: 'Insert a native page break' },
    { name: 'kbd', description: 'Document keyboard shortcuts' },
    { name: 'video', description: 'Embed a video' },
    { name: 'embed', description: 'Include output from Jupyter notebook cells' },
    { name: 'placeholder', description: 'Insert a placeholder image' },
    { name: 'lipsum', description: 'Generate placeholder text (lorem ipsum)' },
    { name: 'version', description: 'Display the Quarto CLI version' },
    { name: 'contents', description: 'Reorganize document content' },
  ];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Check if we're inside a shortcode: {{< ...
    const shortcodeMatch = textBeforeCursor.match(/\{\{<\s*([a-zA-Z0-9_-]*)$/);
    if (!shortcodeMatch) {
      return undefined;
    }

    const partialName = shortcodeMatch[1];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    // Collect all shortcodes
    const allShortcodes: ShortcodeInfo[] = [...ShortcodeCompletionProvider.BUILTIN_SHORTCODES];

    // Add extension shortcodes if workspace is available
    if (workspaceFolder) {
      const extensionShortcodes = this.getExtensionShortcodes(workspaceFolder.uri.fsPath, document.uri.fsPath);
      allShortcodes.push(...extensionShortcodes);
    }

    return this.createCompletionItems(allShortcodes, partialName);
  }

  /**
   * Get shortcodes from extensions with caching.
   */
  private getExtensionShortcodes(workspacePath: string, documentPath: string): ShortcodeInfo[] {
    const cacheKey = `${workspacePath}:${documentPath}`;

    return this.cache.getOrCompute(cacheKey, () => {
      const shortcodes: ShortcodeInfo[] = [];
      const seenExtensions = new Set<string>();

      // Search from document directory up to workspace root
      for (const dir of traverseUpwards(documentPath, workspacePath)) {
        const extensionsDir = path.join(dir, '_extensions');

        if (fs.existsSync(extensionsDir)) {
          const found = this.scanExtensionsDir(extensionsDir, seenExtensions);
          shortcodes.push(...found);
        }
      }

      return shortcodes;
    });
  }

  /**
   * Scan a specific _extensions directory for custom shortcodes.
   */
  private scanExtensionsDir(extensionsDir: string, seenExtensions: Set<string>): ShortcodeInfo[] {
    const shortcodes: ShortcodeInfo[] = [];

    try {
      const entries = fs.readdirSync(extensionsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Check for _extension.yml in this directory
          const extShortcodes = this.parseExtensionDir(
            path.join(extensionsDir, entry.name),
            entry.name,
            seenExtensions
          );
          shortcodes.push(...extShortcodes);

          // Also check subdirectories (for namespaced extensions)
          try {
            const subEntries = fs.readdirSync(path.join(extensionsDir, entry.name), { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isDirectory()) {
                const subExtShortcodes = this.parseExtensionDir(
                  path.join(extensionsDir, entry.name, subEntry.name),
                  `${entry.name}/${subEntry.name}`,
                  seenExtensions
                );
                shortcodes.push(...subExtShortcodes);
              }
            }
          } catch {
            // Ignore errors reading subdirectories
          }
        }
      }
    } catch {
      // Ignore errors reading extensions directory
    }

    return shortcodes;
  }

  /**
   * Parse an extension directory for shortcodes.
   */
  private parseExtensionDir(extPath: string, extName: string, seenExtensions: Set<string>): ShortcodeInfo[] {
    const shortcodes: ShortcodeInfo[] = [];
    const extensionYmlPath = path.join(extPath, '_extension.yml');

    const content = safeReadFile(extensionYmlPath);
    if (!content) {
      return shortcodes;
    }

    const luaFiles = this.parseShortcodesFromYml(content);

    for (const luaFile of luaFiles) {
      const shortcodeName = path.basename(luaFile, '.lua');

      if (seenExtensions.has(shortcodeName)) {
        continue;
      }
      seenExtensions.add(shortcodeName);

      shortcodes.push({
        name: shortcodeName,
        description: `Custom shortcode from ${extName} extension`,
      });
    }

    return shortcodes;
  }

  /**
   * Parse shortcode Lua files from _extension.yml content.
   */
  private parseShortcodesFromYml(content: string): string[] {
    const luaFiles: string[] = [];
    const lines = content.split('\n');
    let inShortcodesSection = false;
    let shortcodesIndent = -1;

    for (const line of lines) {
      // Check for shortcodes: key
      const shortcodesMatch = line.match(/^(\s*)shortcodes:\s*$/);
      if (shortcodesMatch) {
        inShortcodesSection = true;
        shortcodesIndent = shortcodesMatch[1].length;
        continue;
      }

      if (inShortcodesSection) {
        if (line.trim() === '') {
          continue;
        }

        const currentIndent = line.search(/\S/);

        if (currentIndent <= shortcodesIndent && !line.trim().startsWith('-')) {
          inShortcodesSection = false;
          continue;
        }

        const match = line.match(/^\s*-\s*([a-zA-Z0-9_-]+\.lua)\s*$/);
        if (match) {
          luaFiles.push(match[1]);
        }
      }
    }

    return luaFiles;
  }

  /**
   * Create completion items from shortcode info.
   */
  private createCompletionItems(shortcodes: ShortcodeInfo[], partialName: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const seen = new Set<string>();

    for (const shortcode of shortcodes) {
      if (seen.has(shortcode.name)) {
        continue;
      }
      seen.add(shortcode.name);

      if (partialName && !shortcode.name.toLowerCase().includes(partialName.toLowerCase())) {
        continue;
      }

      const item = new vscode.CompletionItem(shortcode.name, vscode.CompletionItemKind.Function);
      item.insertText = shortcode.name;
      item.detail = shortcode.description;
      item.sortText = shortcode.name;
      item.filterText = shortcode.name;
      item.documentation = new vscode.MarkdownString(`**${shortcode.name}**\n\n${shortcode.description}`);

      items.push(item);
    }

    return items;
  }
}
