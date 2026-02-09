import * as vscode from 'vscode';

/**
 * Attribute information for absolute positioning.
 */
interface AttributeInfo {
  name: string;
  description: string;
  example: string;
}

/**
 * Provides autocompletion for RevealJS absolute position attributes.
 * Triggered when typing inside `{.absolute ...}` blocks.
 */
export class AbsolutePositionCompletionProvider implements vscode.CompletionItemProvider {
  // Absolute position attributes
  private static readonly ATTRIBUTES: AttributeInfo[] = [
    { name: 'top', description: 'Distance from the top edge of the slide', example: 'top=100' },
    { name: 'bottom', description: 'Distance from the bottom edge of the slide', example: 'bottom=50' },
    { name: 'left', description: 'Distance from the left edge of the slide', example: 'left=0' },
    { name: 'right', description: 'Distance from the right edge of the slide', example: 'right=100' },
    { name: 'width', description: 'Width of the element', example: 'width="350"' },
    { name: 'height', description: 'Height of the element', example: 'height="300"' },
  ];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    // Check if we're inside an absolute position context
    const context = this.getAbsoluteContext(document, position);
    if (!context) {
      return undefined;
    }

    const { insideBraces, existingAttributes } = context;

    // Filter out attributes that are already present
    const availableAttributes = AbsolutePositionCompletionProvider.ATTRIBUTES.filter(
      attr => !existingAttributes.has(attr.name)
    );

    if (availableAttributes.length === 0) {
      return undefined;
    }

    return this.createCompletionItems(availableAttributes);
  }

  /**
   * Check if cursor is inside {.absolute ...} and return context.
   */
  private getAbsoluteContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ): { insideBraces: string; existingAttributes: Set<string> } | null {
    // Get text inside braces
    const insideBraces = this.getTextInsideBraces(document, position);
    if (insideBraces === null) {
      return null;
    }

    // Check if .absolute class is present
    if (!/\.absolute(?:\s|$|\.)/.test(insideBraces)) {
      return null;
    }

    // Check if cursor is after a space (ready for new attribute)
    const lineText = document.lineAt(position.line).text;
    const charBefore = position.character > 0 ? lineText[position.character - 1] : '';
    if (charBefore !== ' ' && charBefore !== '=') {
      // Also allow completion if we're at the start of typing an attribute name
      const textBeforeCursor = lineText.substring(0, position.character);
      const partialAttr = textBeforeCursor.match(/\s([a-z]*)$/);
      if (!partialAttr) {
        return null;
      }
    }

    // Find existing attributes
    const existingAttributes = this.findExistingAttributes(insideBraces);

    return { insideBraces, existingAttributes };
  }

  /**
   * Get text inside the current brace block.
   */
  private getTextInsideBraces(document: vscode.TextDocument, position: vscode.Position): string | null {
    let lineNum = position.line;
    let charPos = position.character;

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
            const textOnThisLine = lineText.substring(i + 1, endChar);
            return textOnThisLine + textBeforeCursor;
          }
          braceDepth--;
        }
      }

      if (lineNum < position.line) {
        textBeforeCursor = lineText + '\n' + textBeforeCursor;
      }

      lineNum--;
    }

    return null;
  }

  /**
   * Find attributes already present in the brace content.
   */
  private findExistingAttributes(content: string): Set<string> {
    const existing = new Set<string>();

    for (const attr of AbsolutePositionCompletionProvider.ATTRIBUTES) {
      // Match attribute=value or attribute="value"
      const regex = new RegExp(`\\b${attr.name}\\s*=`);
      if (regex.test(content)) {
        existing.add(attr.name);
      }
    }

    return existing;
  }

  /**
   * Create completion items for available attributes.
   */
  private createCompletionItems(attributes: AttributeInfo[]): vscode.CompletionItem[] {
    return attributes.map((attr, index) => {
      const item = new vscode.CompletionItem(attr.name, vscode.CompletionItemKind.Property);

      // Insert attribute with = ready for value
      item.insertText = new vscode.SnippetString(`${attr.name}=\${1:0}`);

      item.detail = attr.description;
      item.documentation = new vscode.MarkdownString(
        `**${attr.name}**\n\n${attr.description}\n\n**Example:** \`${attr.example}\`\n\n` +
        `Values can be specified in CSS units (px, em, etc.). Numbers without units default to pixels.`
      );

      item.sortText = '!' + index.toString().padStart(2, '0');
      item.filterText = attr.name;

      return item;
    });
  }
}
