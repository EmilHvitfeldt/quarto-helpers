import * as vscode from 'vscode';
import * as path from 'path';
import { parseCssLinks } from './cssLinkParser';
import { findFragmentClassesFromFiles } from './fragmentFinder';

/**
 * Cache entry for fragment classes per HTML file.
 */
interface CacheEntry {
  fragmentClasses: string[];
  timestamp: number;
}

/**
 * Provides autocompletion for Quarto reveal.js fragment types.
 * Triggered when typing inside `{.fragment ...}` blocks.
 */
export class FragmentCompletionProvider implements vscode.CompletionItemProvider {
  // Classes to exclude from autocomplete suggestions
  private static readonly EXCLUDED_CLASSES = new Set(['visible', 'current-visible', 'disabled']);

  // Cache for fragment classes, keyed by HTML file path
  private cache = new Map<string, CacheEntry>();

  // Cache TTL in milliseconds (5 seconds)
  private static readonly CACHE_TTL = 5000;

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionList | undefined {
    // Get the HTML file path corresponding to this .qmd file
    const qmdPath = document.uri.fsPath;
    const htmlPath = this.getHtmlPath(qmdPath);

    // Get fragment classes (with caching)
    const fragmentClasses = this.getFragmentClasses(htmlPath);
    if (fragmentClasses.length === 0) {
      return undefined;
    }

    // Get text inside braces, supporting multi-line
    const insideBraces = this.getTextInsideBraces(document, position);
    if (insideBraces === null) {
      return undefined;
    }

    // Check if we're in a valid context for fragment completion
    if (!this.isInFragmentContext(insideBraces, fragmentClasses, document, position)) {
      return undefined;
    }

    // Create completion items
    const items = fragmentClasses.map((className, index) => {
      const item = new vscode.CompletionItem(
        `.${className}`,
        vscode.CompletionItemKind.EnumMember
      );
      item.insertText = `.${className}`;
      item.detail = 'Fragment animation type';
      item.sortText = '!' + index.toString().padStart(3, '0'); // '!' sorts before letters
      item.filterText = `.${className} fragment`; // Better matching
      if (index === 0) {
        item.preselect = true;
      }
      return item;
    });

    // Return as CompletionList (isIncomplete=false doesn't suppress other providers,
    // but we set it anyway for correctness since our list is complete)
    return new vscode.CompletionList(items, false);
  }

  /**
   * Get fragment classes with caching to avoid repeated file I/O.
   */
  private getFragmentClasses(htmlPath: string): string[] {
    const now = Date.now();
    const cached = this.cache.get(htmlPath);

    // Return cached value if still valid
    if (cached && (now - cached.timestamp) < FragmentCompletionProvider.CACHE_TTL) {
      return cached.fragmentClasses;
    }

    // Parse CSS links from the HTML file
    const cssFiles = parseCssLinks(htmlPath);
    if (cssFiles.length === 0) {
      return [];
    }

    // Find all fragment classes from the CSS files
    const fragmentClasses = findFragmentClassesFromFiles(cssFiles)
      .filter(cls => !FragmentCompletionProvider.EXCLUDED_CLASSES.has(cls));

    // Cache the result
    this.cache.set(htmlPath, {
      fragmentClasses,
      timestamp: now
    });

    return fragmentClasses;
  }

  /**
   * Get the text inside the current brace block, supporting multi-line braces.
   * Returns null if not inside braces.
   */
  private getTextInsideBraces(document: vscode.TextDocument, position: vscode.Position): string | null {
    // Start from current position and search backwards for opening brace
    let lineNum = position.line;
    let charPos = position.character;

    // Collect text from cursor backwards
    let textBeforeCursor = '';
    let braceDepth = 0;
    let foundOpenBrace = false;

    while (lineNum >= 0) {
      const lineText = document.lineAt(lineNum).text;
      const endChar = lineNum === position.line ? charPos : lineText.length;

      for (let i = endChar - 1; i >= 0; i--) {
        const char = lineText[i];

        if (char === '}') {
          braceDepth++;
        } else if (char === '{') {
          if (braceDepth === 0) {
            // Found our opening brace
            foundOpenBrace = true;
            // Return text after this brace
            const textOnThisLine = lineText.substring(i + 1, endChar);
            return textOnThisLine + textBeforeCursor;
          }
          braceDepth--;
        }
      }

      // Add this line's content to our collected text (for multi-line support)
      if (lineNum < position.line) {
        textBeforeCursor = lineText + '\n' + textBeforeCursor;
      }

      lineNum--;
    }

    return foundOpenBrace ? textBeforeCursor : null;
  }

  /**
   * Check if the cursor is in a valid context for fragment completion.
   * Valid contexts:
   * - Inside curly braces `{...}`
   * - After `.fragment` (as a complete class, not part of another word)
   * - No fragment animation class already present (only one allowed)
   * - Cursor is after a space or dot (ready for new class)
   */
  private isInFragmentContext(
    insideBraces: string,
    fragmentClasses: string[],
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check if .fragment appears as a complete class (not .fragmentary, etc.)
    // Match .fragment followed by whitespace, end of string, or another class
    if (!/\.fragment(?:\s|$|\.)/.test(insideBraces)) {
      return false;
    }

    // Check if a fragment animation class is already present (only allow one)
    // Use word boundary to avoid false positives (e.g., .fade matching .fade-out)
    for (const fragmentClass of fragmentClasses) {
      const regex = new RegExp(`\\.${this.escapeRegex(fragmentClass)}(?:\\s|$|\\}|\\.)`);
      if (regex.test(insideBraces)) {
        return false;
      }
    }

    // Check if the cursor is after a space or dot (ready for a new class)
    const lineText = document.lineAt(position.line).text;
    const lastChar = lineText.substring(0, position.character).slice(-1);

    return lastChar === ' ' || lastChar === '.';
  }

  /**
   * Escape special regex characters in a string.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get the corresponding HTML file path for a .qmd file.
   * Assumes the HTML file is in the same directory with the same base name.
   */
  private getHtmlPath(qmdPath: string): string {
    const dir = path.dirname(qmdPath);
    const baseName = path.basename(qmdPath, '.qmd');
    return path.join(dir, `${baseName}.html`);
  }
}
