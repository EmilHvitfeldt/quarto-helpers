import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Built-in Quarto shortcode information.
 */
interface ShortcodeInfo {
  name: string;
  description: string;
}

/**
 * Cache entry for shortcodes.
 */
interface ShortcodeCacheEntry {
  shortcodes: ShortcodeInfo[];
  timestamp: number;
}

/**
 * Provides autocompletion for Quarto shortcodes.
 * Suggests both built-in shortcodes and custom shortcodes from extensions.
 */
export class ShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  // Cache for extension shortcodes
  private cache = new Map<string, ShortcodeCacheEntry>();

  // Cache TTL in milliseconds (5 seconds)
  private static readonly CACHE_TTL = 5000;

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

    // Check if we're inside a shortcode: {{< ... but not yet closed
    // Match {{< with optional shortcode name started
    const shortcodeMatch = textBeforeCursor.match(/\{\{<\s*([a-zA-Z0-9_-]*)$/);
    if (!shortcodeMatch) {
      return undefined;
    }

    const partialName = shortcodeMatch[1];

    // Get workspace folder
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
    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && (now - cached.timestamp) < ShortcodeCompletionProvider.CACHE_TTL) {
      return cached.shortcodes;
    }

    const shortcodes = this.scanExtensions(workspacePath, documentPath);

    this.cache.set(cacheKey, {
      shortcodes,
      timestamp: now,
    });

    return shortcodes;
  }

  /**
   * Scan for _extensions directories from document directory up to workspace root.
   */
  private scanExtensions(workspacePath: string, documentPath: string): ShortcodeInfo[] {
    const shortcodes: ShortcodeInfo[] = [];
    const seenExtensions = new Set<string>();

    // Search from document directory up to workspace root
    let currentDir = path.dirname(documentPath);
    while (currentDir.startsWith(workspacePath) || currentDir === workspacePath) {
      const extensionsDir = path.join(currentDir, '_extensions');

      if (fs.existsSync(extensionsDir)) {
        const found = this.scanExtensionsDir(extensionsDir, seenExtensions);
        shortcodes.push(...found);
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }

    return shortcodes;
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
          const extShortcodes = this.parseExtensionDir(path.join(extensionsDir, entry.name), entry.name, seenExtensions);
          shortcodes.push(...extShortcodes);

          // Also check subdirectories (for namespaced extensions like quarto-ext/lightbox)
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

    if (!fs.existsSync(extensionYmlPath)) {
      return shortcodes;
    }

    try {
      const content = fs.readFileSync(extensionYmlPath, 'utf-8');
      const luaFiles = this.parseShortcodesFromYml(content);

      for (const luaFile of luaFiles) {
        // The shortcode name is typically the Lua filename without extension
        const shortcodeName = path.basename(luaFile, '.lua');

        // Skip if we've already seen this shortcode name
        if (seenExtensions.has(shortcodeName)) {
          continue;
        }
        seenExtensions.add(shortcodeName);

        shortcodes.push({
          name: shortcodeName,
          description: `Custom shortcode from ${extName} extension`,
        });
      }
    } catch {
      // Ignore errors parsing extension
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for shortcodes: key (with or without trailing content)
      const shortcodesMatch = line.match(/^(\s*)shortcodes:\s*$/);
      if (shortcodesMatch) {
        inShortcodesSection = true;
        shortcodesIndent = shortcodesMatch[1].length;
        continue;
      }

      if (inShortcodesSection) {
        // Skip empty lines
        if (line.trim() === '') {
          continue;
        }

        const currentIndent = line.search(/\S/);

        // If we hit a line with same or less indent that's not a list item, exit section
        if (currentIndent <= shortcodesIndent && !line.trim().startsWith('-')) {
          inShortcodesSection = false;
          continue;
        }

        // Match list items like "- shortcode.lua" or "    - shortcode.lua"
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
      // Skip duplicates
      if (seen.has(shortcode.name)) {
        continue;
      }
      seen.add(shortcode.name);

      // Filter by partial name if user has typed something
      if (partialName && !shortcode.name.toLowerCase().includes(partialName.toLowerCase())) {
        continue;
      }

      const item = new vscode.CompletionItem(shortcode.name, vscode.CompletionItemKind.Function);
      item.insertText = shortcode.name;
      item.detail = shortcode.description;
      item.sortText = shortcode.name;
      item.filterText = shortcode.name;

      // Add documentation
      item.documentation = new vscode.MarkdownString(`**${shortcode.name}**\n\n${shortcode.description}`);

      items.push(item);
    }

    return items;
  }
}
