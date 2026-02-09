import * as vscode from 'vscode';
import * as path from 'path';
import { parseCssLinks } from './cssLinkParser';
import { findFragmentClassesFromFiles } from './fragmentFinder';
import { findJsFragmentClasses } from './jsFragmentFinder';
import { CacheManager, getTextInsideBraces, escapeRegex } from './utils';

/**
 * Provides autocompletion for Quarto reveal.js fragment types.
 * Triggered when typing inside `{.fragment ...}` blocks.
 */
export class FragmentCompletionProvider implements vscode.CompletionItemProvider {
  // Classes to exclude from autocomplete suggestions
  private static readonly EXCLUDED_CLASSES = new Set(['visible', 'current-visible', 'disabled']);

  // Cache for fragment classes, keyed by HTML file path
  private cache = new CacheManager<string[]>();

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
    const insideBraces = getTextInsideBraces(document, position);
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
      item.sortText = '!' + index.toString().padStart(3, '0');
      item.filterText = `.${className} fragment`;
      if (index === 0) {
        item.preselect = true;
      }
      return item;
    });

    return new vscode.CompletionList(items, false);
  }

  /**
   * Get fragment classes with caching to avoid repeated file I/O.
   */
  private getFragmentClasses(htmlPath: string): string[] {
    return this.cache.getOrCompute(htmlPath, () => {
      const allClasses = new Set<string>();

      // Find fragment classes from CSS files
      const cssFiles = parseCssLinks(htmlPath);
      if (cssFiles.length > 0) {
        const cssClasses = findFragmentClassesFromFiles(cssFiles);
        for (const cls of cssClasses) {
          allClasses.add(cls);
        }
      }

      // Find custom fragment classes defined in JavaScript
      const jsClasses = findJsFragmentClasses(htmlPath);
      for (const cls of jsClasses) {
        allClasses.add(cls);
      }

      // Filter excluded classes and sort
      return Array.from(allClasses)
        .filter(cls => !FragmentCompletionProvider.EXCLUDED_CLASSES.has(cls))
        .sort();
    });
  }

  /**
   * Check if the cursor is in a valid context for fragment completion.
   */
  private isInFragmentContext(
    insideBraces: string,
    fragmentClasses: string[],
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    // Check if .fragment appears as a complete class
    if (!/\.fragment(?:\s|$|\.)/.test(insideBraces)) {
      return false;
    }

    // Check if a fragment animation class is already present
    for (const fragmentClass of fragmentClasses) {
      const regex = new RegExp(`\\.${escapeRegex(fragmentClass)}(?:\\s|$|\\}|\\.)`);
      if (regex.test(insideBraces)) {
        return false;
      }
    }

    // Check if the cursor is after a space or dot
    const lineText = document.lineAt(position.line).text;
    const lastChar = lineText.substring(0, position.character).slice(-1);

    return lastChar === ' ' || lastChar === '.';
  }

  /**
   * Get the corresponding HTML file path for a .qmd file.
   */
  private getHtmlPath(qmdPath: string): string {
    const dir = path.dirname(qmdPath);
    const baseName = path.basename(qmdPath, '.qmd');
    return path.join(dir, `${baseName}.html`);
  }
}
