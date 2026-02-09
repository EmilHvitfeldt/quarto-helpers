import * as vscode from 'vscode';

/**
 * Get text inside the current brace block at the given position.
 * Supports multi-line brace blocks.
 *
 * @param document The text document
 * @param position The cursor position
 * @returns Text inside braces, or null if not inside braces
 */
export function getTextInsideBraces(
  document: vscode.TextDocument,
  position: vscode.Position
): string | null {
  let lineNum = position.line;
  const charPos = position.character;

  let textBeforeCursor = '';
  let braceDepth = 0;

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

  return null;
}

/**
 * Check if a class is present in the brace content.
 * Matches the class as a complete token (not part of another word).
 *
 * @param content Content inside braces
 * @param className Class name to check for (without the dot)
 * @returns True if the class is present
 */
export function hasClass(content: string, className: string): boolean {
  const regex = new RegExp(`\\.${escapeRegex(className)}(?:\\s|$|\\.)`);
  return regex.test(content);
}

/**
 * Escape special regex characters in a string.
 *
 * @param str String to escape
 * @returns Escaped string safe for use in regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
