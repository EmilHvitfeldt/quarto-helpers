import * as vscode from 'vscode';
import * as path from 'path';
import { parseCssLinks } from './cssLinkParser';
import { findFragmentClassesFromFiles } from './fragmentFinder';

/**
 * Provides autocompletion for Quarto reveal.js fragment types.
 * Triggered when typing inside `{.fragment ...}` blocks.
 */
export class FragmentCompletionProvider implements vscode.CompletionItemProvider {
  // Classes to exclude from autocomplete suggestions
  private static readonly EXCLUDED_CLASSES = new Set(['visible', 'current-visible', 'disabled']);

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    // Get the text from the start of the line to the cursor
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Get the HTML file path corresponding to this .qmd file
    const qmdPath = document.uri.fsPath;
    const htmlPath = this.getHtmlPath(qmdPath);

    // Parse CSS links from the HTML file
    const cssFiles = parseCssLinks(htmlPath);
    if (cssFiles.length === 0) {
      return undefined;
    }

    // Find all fragment classes from the CSS files
    const fragmentClasses = findFragmentClassesFromFiles(cssFiles)
      .filter(cls => !FragmentCompletionProvider.EXCLUDED_CLASSES.has(cls));

    if (fragmentClasses.length === 0) {
      return undefined;
    }

    // Check if we're in a valid context for fragment completion
    // Pass fragmentClasses to check if one is already used
    if (!this.isInFragmentContext(textBeforeCursor, fragmentClasses)) {
      return undefined;
    }

    // Create completion items
    return fragmentClasses.map((className, index) => {
      const item = new vscode.CompletionItem(
        `.${className}`,
        vscode.CompletionItemKind.Value
      );
      item.insertText = `.${className}`;
      item.detail = 'Fragment animation type';
      item.sortText = index.toString().padStart(3, '0');
      return item;
    });
  }

  /**
   * Check if the cursor is in a valid context for fragment completion.
   * Valid contexts:
   * - Inside curly braces `{...}`
   * - After `.fragment` followed by a space
   * - No fragment animation class already present (only one allowed)
   */
  private isInFragmentContext(textBeforeCursor: string, fragmentClasses: string[]): boolean {
    // Find the last opening brace that isn't closed
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
    const lastCloseBrace = textBeforeCursor.lastIndexOf('}');

    // Not inside braces
    if (lastOpenBrace === -1 || lastCloseBrace > lastOpenBrace) {
      return false;
    }

    // Get text inside the braces
    const insideBraces = textBeforeCursor.substring(lastOpenBrace + 1);

    // Check if .fragment appears in the brace content
    if (!insideBraces.includes('.fragment')) {
      return false;
    }

    // Check if a fragment animation class is already present (only allow one)
    for (const fragmentClass of fragmentClasses) {
      if (insideBraces.includes(`.${fragmentClass}`)) {
        return false;
      }
    }

    // Check if the cursor is after a space (ready for a new class)
    // The text should end with a space or a dot (starting a new class)
    const lastChar = textBeforeCursor.slice(-1);

    // Valid if:
    // 1. Last character is a space (ready for new class)
    // 2. Last character is a dot (user started typing a class)
    return lastChar === ' ' || lastChar === '.';
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
