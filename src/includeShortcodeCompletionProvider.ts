import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Cache entry for workspace files.
 */
interface FileCacheEntry {
  files: string[];
  timestamp: number;
}

/**
 * Provides autocompletion for Quarto include shortcodes.
 * Triggered when typing inside `{{< include ... >}}` blocks.
 */
export class IncludeShortcodeCompletionProvider implements vscode.CompletionItemProvider {
  // Cache for workspace files
  private cache = new Map<string, FileCacheEntry>();

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
    '.vscode',
    '.idea',
  ]);

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    // Check if we're inside an include shortcode
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Match {{< include with optional partial path after it
    const includeMatch = textBeforeCursor.match(/\{\{<\s*include\s+([^>]*)$/);
    if (!includeMatch) {
      return undefined;
    }

    // Get the partial path that's already typed
    const partialPath = includeMatch[1].trim();

    // Get the workspace folder
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return undefined;
    }

    // Get all files in the workspace (with caching)
    const workspacePath = workspaceFolder.uri.fsPath;
    const allFiles = this.getWorkspaceFiles(workspacePath);

    if (allFiles.length === 0) {
      return undefined;
    }

    // Get the directory of the current document for relative path calculation
    const documentDir = path.dirname(document.uri.fsPath);

    // Create completion items
    const items: vscode.CompletionItem[] = [];

    for (const filePath of allFiles) {
      // Skip the current file
      if (filePath === document.uri.fsPath) {
        continue;
      }

      // Calculate relative path from the document
      let relativePath = path.relative(documentDir, filePath);

      // Normalize path separators to forward slashes
      relativePath = relativePath.replace(/\\/g, '/');

      // Filter by partial path if user has typed something
      if (partialPath && !relativePath.toLowerCase().includes(partialPath.toLowerCase())) {
        continue;
      }

      const fileName = path.basename(filePath);

      const item = new vscode.CompletionItem(relativePath, vscode.CompletionItemKind.File);
      item.insertText = relativePath;
      item.detail = fileName;

      // Add documentation with file info
      const isUnderscoredFile = fileName.startsWith('_');
      let docText = `Include file: \`${relativePath}\``;
      if (isUnderscoredFile) {
        docText += '\n\n*Underscore-prefixed files are automatically ignored during project rendering.*';
      }
      item.documentation = new vscode.MarkdownString(docText);

      // Sort underscore-prefixed files first (Quarto convention)
      if (isUnderscoredFile) {
        item.sortText = '!' + relativePath;
      } else {
        item.sortText = relativePath;
      }

      // Filter text for better matching
      item.filterText = relativePath + ' ' + fileName;

      items.push(item);
    }

    return items;
  }

  /**
   * Get all includable files in the workspace with caching.
   */
  private getWorkspaceFiles(workspacePath: string): string[] {
    const now = Date.now();
    const cached = this.cache.get(workspacePath);

    // Return cached value if still valid
    if (cached && (now - cached.timestamp) < IncludeShortcodeCompletionProvider.CACHE_TTL) {
      return cached.files;
    }

    const files = this.scanDirectory(workspacePath);

    // Cache the result
    this.cache.set(workspacePath, {
      files,
      timestamp: now,
    });

    return files;
  }

  /**
   * Recursively scan a directory for includable files.
   */
  private scanDirectory(dir: string): string[] {
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
          if (!IncludeShortcodeCompletionProvider.IGNORE_DIRS.has(entry.name)) {
            scan(fullPath);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }
}
